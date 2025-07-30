import { client, writeClient } from "@/sanity/client";

/**
 * Product Cleanup Utilities
 *
 * Shared functions for cleaning up product reservations and stock data.
 * This module contains the core logic that was previously duplicated
 * across multiple API endpoints.
 */

export interface ForceCleanupParams {
  productId: string;
  sessionId?: string;
  clearAll?: boolean;
}

export interface ForceCleanupResult {
  success: boolean;
  productId: string;
  message: string;
  originalCount?: number;
  clearedCount?: number;
  remainingCount?: number;
  productTitle?: string;
  error?: string;
}

/**
 * Type guard for reservation objects
 */
const isValidReservation = (
  reservation: unknown
): reservation is { sessionId?: string; reservedUntil?: string } => {
  return typeof reservation === "object" && reservation !== null;
};

/**
 * Force cleanup reservations for a specific product
 *
 * This function performs the core cleanup logic that was previously
 * duplicated in the API endpoint. It can be called directly without
 * making HTTP requests to the same application.
 */
export async function forceCleanupProduct(
  params: ForceCleanupParams
): Promise<ForceCleanupResult> {
  const { productId, sessionId, clearAll = false } = params;

  try {
    // Validate productId format
    if (
      !productId ||
      typeof productId !== "string" ||
      productId.trim().length === 0
    ) {
      return {
        success: false,
        productId,
        message: "Invalid product ID format",
        error: "Product ID must be a non-empty string",
      };
    }

    // Validate sessionId if provided
    if (sessionId !== undefined && sessionId !== null) {
      if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
        return {
          success: false,
          productId,
          message: "Invalid session ID",
          error: "Session ID must be a non-empty string",
        };
      }
    }

    // Get current product data
    const product = await client.fetch(
      `*[_type == "clothingItem" && _id == $productId][0]{
        _id, _rev, title, stock, reservations
      }`,
      { productId }
    );

    if (!product) {
      return {
        success: false,
        productId,
        message: "Product not found",
        error: "Product does not exist",
      };
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
          if (!isValidReservation(reservation)) {
            console.warn("Invalid reservation object found, skipping");
            return true; // Keep invalid reservations to avoid data loss
          }
          return reservation.sessionId !== sessionId;
        }
      );
      console.log(
        `🧹 Force clearing reservations for specific session on product ${productId}`
      );
    } else {
      // Clear expired reservations
      const now = new Date();
      updatedReservations = updatedReservations.filter(
        (reservation: unknown) => {
          if (!isValidReservation(reservation)) {
            console.warn("Invalid reservation object found, skipping");
            return true; // Keep invalid reservations to avoid data loss
          }

          // Safe date parsing with validation
          const reservedUntil = reservation.reservedUntil;
          if (
            !reservedUntil ||
            typeof reservedUntil !== "string" ||
            reservedUntil.trim().length === 0
          ) {
            console.warn(
              "Invalid reservedUntil value found, keeping reservation"
            );
            return true; // Keep reservations with invalid dates
          }

          try {
            const reservationDate = new Date(reservedUntil);
            // Check if the date is valid
            if (isNaN(reservationDate.getTime())) {
              console.warn(
                "Invalid date format in reservedUntil, keeping reservation"
              );
              return true; // Keep reservations with invalid date formats
            }
            return reservationDate > now;
          } catch (dateError) {
            console.warn(
              "Error parsing reservation date, keeping reservation:",
              dateError
            );
            return true; // Keep reservations that cause parsing errors
          }
        }
      );
      console.log(
        `🧹 Force clearing expired reservations for product ${productId}`
      );
    }

    const clearedCount = originalCount - updatedReservations.length;

    // Update the product with cleaned reservations using optimistic locking
    await writeClient
      .patch(productId)
      .ifRevisionId(product._rev)
      .set({
        reservations: updatedReservations,
      })
      .commit();

    console.log(
      `✅ Force cleanup completed for product ${productId}: ${clearedCount} reservations cleared`
    );

    return {
      success: true,
      productId,
      message: `Force cleanup completed`,
      originalCount,
      clearedCount,
      remainingCount: updatedReservations.length,
      productTitle: product.title,
    };
  } catch (error) {
    console.error(`Force cleanup error for product ${productId}:`, error);
    return {
      success: false,
      productId,
      message: "Failed to force cleanup reservations",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Batch force cleanup for multiple products
 *
 * This function performs cleanup on multiple products efficiently
 * without making HTTP requests to the same application.
 */
export async function forceCleanupProducts(
  productIds: string[],
  clearAll: boolean = true
): Promise<{
  success: boolean;
  message: string;
  results: ForceCleanupResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}> {
  const results: ForceCleanupResult[] = [];

  // Perform force cleanup for each product
  for (const productId of productIds) {
    try {
      // Extract base product ID from order product ID (remove size and timestamp metadata)
      const baseProductId = productId.split(":::")[0];

      const result = await forceCleanupProduct({
        productId: baseProductId,
        clearAll: clearAll,
      });

      results.push(result);

      if (result.success) {
        console.log(`✅ Force cleanup completed for ${baseProductId}:`, result);
      } else {
        console.error(
          `❌ Force cleanup failed for ${baseProductId}:`,
          result.error
        );
      }
    } catch (error) {
      const errorResult: ForceCleanupResult = {
        success: false,
        productId: productId,
        message: `Error during force cleanup: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      results.push(errorResult);
      console.error(`❌ Error during force cleanup for ${productId}:`, error);
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  return {
    success: failureCount === 0,
    message: `Force cleanup completed: ${successCount} successful, ${failureCount} failed`,
    results: results,
    summary: {
      total: results.length,
      successful: successCount,
      failed: failureCount,
    },
  };
}
