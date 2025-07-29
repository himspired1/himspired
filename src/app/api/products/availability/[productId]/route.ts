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
    const reservations: Reservation[] = (product.reservations || []).filter(
      (r: Reservation) => r.reservedUntil && new Date(r.reservedUntil) > now
    );

    // Check for pending orders that contain this product
    // CRITICAL: This query is essential for accurate stock calculation
    // If this fails, we must not continue with incorrect stock data
    let pendingOrderReservedQuantity = 0;
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

      // Calculate total quantity reserved by pending orders
      pendingOrderReservedQuantity = pendingOrders.reduce((total, order) => {
        const orderItem = order.items.find(
          (item: { productId: string; quantity: number }) =>
            item.productId === productId
        );
        return total + (orderItem ? orderItem.quantity : 0);
      }, 0);
    } catch (error) {
      console.error("Failed to check pending orders:", error);
      // Rethrow the error to prevent continuing with incorrect stock calculations
      // This ensures the failure is propagated and handled upstream
      throw new Error(
        `MongoDB query failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Calculate reserved quantity and available stock
    const reservationQuantity = reservations.reduce(
      (sum, r) => sum + (r.quantity || 0),
      0
    );
    const totalReservedQuantity =
      reservationQuantity + pendingOrderReservedQuantity;
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
