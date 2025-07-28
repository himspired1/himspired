import { NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";

export async function POST() {
  try {
    // Find all products with reservations
    const productsWithReservations = await client.fetch(
      `
      *[_type == "clothingItem" && reservations != null && count(reservations) > 0]{
        _id,
        title,
        reservations
      }
    `
    );

    if (productsWithReservations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No products with reservations found",
        clearedCount: 0,
      });
    }

    let totalCleared = 0;

    // Process each product and clean up expired reservations
    const clearPromises = productsWithReservations.map(
      async (product: {
        _id: string;
        title: string;
        reservations: { reservedUntil: string }[];
      }) => {
        const now = new Date();

        // Filter out expired reservations
        const validReservations = product.reservations.filter(
          (reservation: { reservedUntil: string }) => {
            const reservationDate = new Date(reservation.reservedUntil);
            return reservationDate > now;
          }
        );

        // If all reservations are expired, clear the entire reservations array
        if (validReservations.length === 0) {
          await writeClient
            .patch(product._id)
            .set({ reservations: [] })
            .commit();

          console.log(`Cleared all expired reservations for: ${product.title}`);
          totalCleared += product.reservations.length;
        } else if (validReservations.length < product.reservations.length) {
          // Some reservations are expired, update with only valid ones
          await writeClient
            .patch(product._id)
            .set({ reservations: validReservations })
            .commit();

          const expiredCount =
            product.reservations.length - validReservations.length;
          console.log(
            `Cleared ${expiredCount} expired reservations for: ${product.title}`
          );
          totalCleared += expiredCount;
        }
      }
    );

    await Promise.all(clearPromises);

    return NextResponse.json({
      success: true,
      message: `Cleared ${totalCleared} expired reservations`,
      clearedCount: totalCleared,
    });
  } catch (error) {
    console.error("Reservation cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup reservations" },
      { status: 500 }
    );
  }
}
