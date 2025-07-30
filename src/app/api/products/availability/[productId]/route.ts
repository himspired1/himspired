import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";
import clientPromise from "@/lib/mongodb";

type Reservation = {
  sessionId: string;
  quantity: number;
  reservedUntil: string;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;
    const sessionId = req.nextUrl.searchParams.get("sessionId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Get product stock and reservations from Sanity
    const product = await client.fetch(
      `*[_type == "clothingItem" && _id == $productId][0]{
        _id, title, stock, reservations
      }`,
      { productId }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Clean up expired reservations
    const now = new Date();
    const allReservations: Reservation[] = (product.reservations || []).filter(
      (r: Reservation) => r.reservedUntil && new Date(r.reservedUntil) > now
    );

    // Aggregate reservations by sessionId to handle duplicates
    const aggregatedReservations = new Map<string, number>();
    allReservations.forEach((reservation) => {
      const currentQuantity =
        aggregatedReservations.get(reservation.sessionId) || 0;
      aggregatedReservations.set(
        reservation.sessionId,
        currentQuantity + (reservation.quantity || 0)
      );
    });

    // Convert back to reservation format for consistency
    const reservations: Reservation[] = Array.from(
      aggregatedReservations.entries()
    ).map(([sessionId, quantity]) => ({
      sessionId,
      quantity,
      reservedUntil:
        allReservations.find((r) => r.sessionId === sessionId)?.reservedUntil ||
        new Date().toISOString(),
    }));

    // Check for pending orders that contain this product
    // CRITICAL: This query is essential for accurate stock calculation
    // If this fails, we must not continue with incorrect stock data
    const pendingOrderDetails: Array<{ sessionId: string; quantity: number }> =
      [];

    try {
      const mongoClient = await clientPromise;
      const db = mongoClient.db("himspired");
      const ordersCollection = db.collection("orders");

      // Find pending orders that contain this product
      const pendingOrders = await ordersCollection
        .find({
          status: "payment_pending",
          "items.productId": productId,
        })
        .toArray();

      // Calculate total quantity reserved by pending orders and track session details
      pendingOrders.forEach((order) => {
        const orderItem = order.items.find(
          (item: { productId: string; quantity: number }) =>
            item.productId === productId
        );

        if (orderItem) {
          const quantity = orderItem.quantity || 0;
          // Track session details for correlation
          if (order.sessionId) {
            pendingOrderDetails.push({
              sessionId: order.sessionId,
              quantity: quantity,
            });
          }
        }
      });
    } catch (error) {
      console.error("Failed to check pending orders:", error);
      // Rethrow the error to prevent continuing with incorrect stock calculations
      // This ensures the failure is propagated and handled upstream
      throw new Error(
        `MongoDB query failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // CORRELATION LOGIC: Properly calculate total reserved quantity
    // by correlating reservations with pending orders to avoid double-counting
    let totalReservedQuantity = 0;
    let correlatedReservations = 0;
    let uncorrelatedReservations = 0;
    let uncorrelatedPendingOrders = 0;

    // Create a map of session IDs from pending orders for quick lookup
    const pendingOrderSessionIds = new Set(
      pendingOrderDetails.map((detail) => detail.sessionId)
    );

    // Calculate reservations that are NOT correlated with pending orders
    // These are reservations that don't have corresponding pending orders
    uncorrelatedReservations = reservations.reduce((total, reservation) => {
      // If this reservation's sessionId is NOT in pending orders, count it
      if (!pendingOrderSessionIds.has(reservation.sessionId)) {
        return total + (reservation.quantity || 0);
      }
      return total;
    }, 0);

    // Calculate pending orders that are NOT correlated with reservations
    // These are pending orders that don't have corresponding active reservations
    const reservationSessionIds = new Set(reservations.map((r) => r.sessionId));

    uncorrelatedPendingOrders = pendingOrderDetails.reduce((total, detail) => {
      // If this pending order's sessionId is NOT in active reservations, count it
      if (!reservationSessionIds.has(detail.sessionId)) {
        return total + detail.quantity;
      }
      return total;
    }, 0);

    // Calculate correlated quantities (reservations that have corresponding pending orders)
    // For correlated items, we use the maximum of reservation and pending order quantity
    // to avoid double-counting the same items
    correlatedReservations = reservations.reduce((total, reservation) => {
      if (pendingOrderSessionIds.has(reservation.sessionId)) {
        // Find the corresponding pending order quantity
        const pendingOrderDetail = pendingOrderDetails.find(
          (detail) => detail.sessionId === reservation.sessionId
        );

        if (pendingOrderDetail) {
          // Use the maximum to avoid double-counting the same items
          const maxQuantity = Math.max(
            reservation.quantity || 0,
            pendingOrderDetail.quantity || 0
          );
          return total + maxQuantity;
        }
      }
      return total;
    }, 0);

    // Total reserved quantity = uncorrelated reservations + uncorrelated pending orders + correlated max
    totalReservedQuantity =
      uncorrelatedReservations +
      uncorrelatedPendingOrders +
      correlatedReservations;

    // Calculate available stock
    const availableStock = Math.max(0, product.stock - totalReservedQuantity);
    const userReservation = reservations.find((r) => r.sessionId === sessionId);
    const reservedByCurrentUser = userReservation
      ? userReservation.quantity
      : 0;
    const reservedByOthers = totalReservedQuantity - reservedByCurrentUser;

    // Check if product is out of stock
    if (product.stock <= 0) {
      return NextResponse.json({
        available: false,
        message: "Product is out of stock",
        stock: 0,
        permanentlyOutOfStock: true,
      });
    }

    // If user has a reservation
    if (reservedByCurrentUser > 0) {
      return NextResponse.json({
        available: true,
        message: `You reserved ${reservedByCurrentUser} item${reservedByCurrentUser > 1 ? "s" : ""}`,
        stock: product.stock,
        availableStock: availableStock,
        reservedQuantity: totalReservedQuantity,
        reservedByCurrentUser,
        reservedByOthers,
        isReservedByCurrentUser: true,
      });
    }

    // If all items are reserved by others
    if (availableStock === 0) {
      // When all items are reserved by others, show appropriate message
      let message = "Item currently reserved by another customer";
      if (reservedByOthers >= product.stock) {
        message = "Item reserved by other users";
      }

      return NextResponse.json({
        available: false,
        message: message,
        stock: product.stock,
        availableStock: 0,
        reservedQuantity: totalReservedQuantity,
        reservedByCurrentUser,
        reservedByOthers,
        isReservedByOtherUser: true,
      });
    }

    // If some items are reserved by others, but there is still available stock
    if (reservedByOthers > 0 && availableStock > 0) {
      return NextResponse.json({
        available: true,
        message: `${availableStock} in stock, ${reservedByOthers} currently reserved by others`,
        stock: product.stock,
        availableStock: availableStock,
        reservedQuantity: totalReservedQuantity,
        reservedByCurrentUser,
        reservedByOthers,
        isReservedByOtherUser: true,
      });
    }

    // Product is available
    return NextResponse.json({
      available: true,
      message: `${availableStock} in stock`,
      stock: product.stock,
      availableStock: availableStock,
      reservedQuantity: totalReservedQuantity,
      reservedByCurrentUser,
      reservedByOthers,
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
