import { NextRequest, NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";

/**
 * Force Cleanup Reservations Endpoint
 *
 * This endpoint forcefully cleans up all reservations for a specific product.
 * It's used when reservations are stuck and need manual intervention.
 *
 * Usage: POST /api/products/force-cleanup/[productId]
 * Body: { sessionId?: string, clearAll?: boolean }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    // Simple token-based authentication for force cleanup
    const authHeader = req.headers.get("authorization");
    const expectedToken =
      process.env.STOCK_MODIFICATION_TOKEN || "admin-stock-token";

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Valid token required to force cleanup reservations",
        },
        { status: 401 }
      );
    }

    const { productId } = await context.params;
    const { sessionId, clearAll = false } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Get current product data
    const product = await client.fetch(
      `*[_type == "clothingItem" && _id == $productId][0]{
        _id, title, stock, reservations
      }`,
      { productId }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let updatedReservations = product.reservations || [];
    const originalCount = updatedReservations.length;

    if (clearAll) {
      // Clear all reservations
      updatedReservations = [];
      console.log(
        `🧹 Force clearing ALL reservations for product ${productId}`
      );
    } else if (sessionId) {
      // Clear reservations for specific session
      updatedReservations = updatedReservations.filter(
        (reservation: unknown) => {
          const res = reservation as { sessionId?: string };
          return res.sessionId !== sessionId;
        }
      );
      console.log(
        `🧹 Force clearing reservations for session ${sessionId} on product ${productId}`
      );
    } else {
      // Clear expired reservations
      const now = new Date();
      updatedReservations = updatedReservations.filter(
        (reservation: unknown) => {
          const res = reservation as { reservedUntil?: string };
          const reservationDate = new Date(res.reservedUntil || "");
          return reservationDate > now;
        }
      );
      console.log(
        `🧹 Force clearing expired reservations for product ${productId}`
      );
    }

    const clearedCount = originalCount - updatedReservations.length;

    // Update the product with cleaned reservations
    await writeClient
      .patch(productId)
      .set({
        reservations: updatedReservations,
        _updatedAt: new Date().toISOString(),
      })
      .commit();

    console.log(
      `✅ Force cleanup completed for product ${productId}: ${clearedCount} reservations cleared`
    );

    return NextResponse.json({
      success: true,
      message: `Force cleanup completed`,
      productId,
      originalCount,
      clearedCount,
      remainingCount: updatedReservations.length,
      productTitle: product.title,
    });
  } catch (error) {
    console.error("Force cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to force cleanup reservations" },
      { status: 500 }
    );
  }
}
