import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";

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

    // Calculate reserved quantity and available stock
    const reservedQuantity = reservations.reduce(
      (sum, r) => sum + (r.quantity || 0),
      0
    );
    const availableStock = Math.max(0, product.stock - reservedQuantity);
    const userReservation = reservations.find((r) => r.sessionId === sessionId);
    const reservedByCurrentUser = userReservation
      ? userReservation.quantity
      : 0;
    const reservedByOthers = reservedQuantity - reservedByCurrentUser;

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
        reservedQuantity: reservedQuantity,
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
        reservedQuantity: reservedQuantity,
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
        reservedQuantity: reservedQuantity,
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
      reservedQuantity: reservedQuantity,
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
