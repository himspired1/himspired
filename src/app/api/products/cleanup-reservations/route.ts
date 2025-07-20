import { NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";

export async function POST() {
  try {
    // Find all products with expired reservations
    const productsWithExpiredReservations = await client.fetch(
      `
      *[_type == "clothingItem" && reservedUntil != null && reservedUntil < $now]{
        _id,
        title,
        reservedUntil,
        reservedBy,
        reservedQuantity
      }
    `,
      { now: new Date().toISOString() }
    );

    if (productsWithExpiredReservations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired reservations found",
        clearedCount: 0,
      });
    }

    // Clear expired reservations
    const clearPromises = productsWithExpiredReservations.map(
      async (product: { _id: string; title: string }) => {
        await writeClient
          .patch(product._id)
          .unset(["reservedUntil", "reservedBy", "reservedQuantity"])
          .commit();

        console.log(`Cleared expired reservation for: ${product.title}`);
      }
    );

    await Promise.all(clearPromises);

    return NextResponse.json({
      success: true,
      message: `Cleared ${productsWithExpiredReservations.length} expired reservations`,
      clearedCount: productsWithExpiredReservations.length,
    });
  } catch (error) {
    console.error("Reservation cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup reservations" },
      { status: 500 }
    );
  }
}
