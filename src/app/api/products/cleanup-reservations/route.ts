import { NextRequest, NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";
import { AdminAuth } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    // Authentication check - only allow admin users
    const isAuthenticated = await AdminAuth.isAuthenticatedFromRequest(req);
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            "Admin authentication required to perform reservation cleanup",
        },
        { status: 401 }
      );
    }

    // Configuration for batching
    const BATCH_SIZE = 50; // Process 50 products at a time
    let totalCleared = 0;
    let totalErrors = 0;
    const errorLog: Array<{ productId: string; title: string; error: string }> =
      [];

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
        errors: [],
      });
    }

    console.log(
      `Found ${productsWithReservations.length} products with reservations to process`
    );

    // Process products in batches to handle large datasets efficiently
    for (let i = 0; i < productsWithReservations.length; i += BATCH_SIZE) {
      const batch = productsWithReservations.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(productsWithReservations.length / BATCH_SIZE)}`
      );

      // Process each product in the current batch with individual error handling
      const batchPromises = batch.map(
        async (product: {
          _id: string;
          title: string;
          reservations: { reservedUntil: string }[];
        }) => {
          try {
            const now = new Date();

            // Filter out expired reservations
            const validReservations = product.reservations.filter(
              (reservation: { reservedUntil: string }) => {
                const reservationDate = new Date(reservation.reservedUntil);
                return reservationDate > now;
              }
            );

            const expiredCount =
              product.reservations.length - validReservations.length;

            // Only update if there are expired reservations to clear
            if (expiredCount > 0) {
              if (validReservations.length === 0) {
                // All reservations are expired, clear the entire array
                await writeClient
                  .patch(product._id)
                  .set({ reservations: [] })
                  .commit();

                console.log(
                  `Cleared all ${product.reservations.length} expired reservations for: ${product.title}`
                );
                totalCleared += product.reservations.length;
              } else {
                // Some reservations are expired, update with only valid ones
                await writeClient
                  .patch(product._id)
                  .set({ reservations: validReservations })
                  .commit();

                console.log(
                  `Cleared ${expiredCount} expired reservations for: ${product.title}`
                );
                totalCleared += expiredCount;
              }
            }

            return {
              success: true,
              productId: product._id,
              cleared: expiredCount,
            };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            console.error(
              `Error processing product ${product._id} (${product.title}):`,
              error
            );

            errorLog.push({
              productId: product._id,
              title: product.title,
              error: errorMessage,
            });

            totalErrors++;
            return {
              success: false,
              productId: product._id,
              error: errorMessage,
            };
          }
        }
      );

      // Wait for current batch to complete before processing next batch
      const batchResults = await Promise.allSettled(batchPromises);

      // Log batch completion
      const successfulResults = batchResults.filter(
        (result) => result.status === "fulfilled" && result.value.success
      ).length;

      console.log(
        `Batch completed: ${successfulResults}/${batch.length} products processed successfully`
      );
    }

    // Prepare response with detailed information
    const response = {
      success: true,
      message: `Reservation cleanup completed`,
      summary: {
        totalProducts: productsWithReservations.length,
        totalCleared,
        totalErrors,
        successRate:
          (
            ((productsWithReservations.length - totalErrors) /
              productsWithReservations.length) *
            100
          ).toFixed(2) + "%",
      },
      errors: errorLog.length > 0 ? errorLog : undefined,
    };

    console.log(
      `Cleanup completed: ${totalCleared} reservations cleared, ${totalErrors} errors encountered`
    );

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Reservation cleanup error:", error);
    return NextResponse.json(
      {
        error: "Failed to cleanup reservations",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
