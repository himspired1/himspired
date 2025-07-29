import { NextRequest, NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";
import { AdminAuth } from "@/lib/admin-auth";
import { sanityRateLimiter } from "@/lib/sanity-retry";

/**
 * Set Product Out of Stock Endpoint
 * 
 * This endpoint allows admin users to manually set a product's stock to 0.
 * 
 * Security Features:
 * - Admin authentication required
 * - Rate limiting to prevent abuse
 * - Atomic transactions to prevent race conditions
 * - Comprehensive error handling
 * 
 * Usage: POST /api/products/set-out-of-stock/[productId]
 */

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    // Authentication check - only allow admin users
    const isAuthenticated = await AdminAuth.isAuthenticatedFromRequest(req);
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Admin authentication required to set products out of stock",
        },
        { status: 401 }
      );
    }

    const { productId } = await context.params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Use atomic operation with rate limiting to prevent race conditions
    const result = await sanityRateLimiter.executeWithRateLimit(
      "set-out-of-stock",
      async () => {
        // Start a transaction to ensure atomicity
        const transaction = writeClient.transaction();

        try {
          // Fetch product within the transaction
          const product = await transaction.getDocument(productId);

          if (!product) {
            throw new Error("Product not found");
          }

          // Validate that it's a clothing item
          if (product._type !== "clothingItem") {
            throw new Error("Invalid product type");
          }

          const currentStock = product.stock || 0;

          // Patch the product within the same transaction
          transaction.patch(productId, (patch) => patch.set({ stock: 0 }));

          // Commit the transaction atomically
          await transaction.commit();

          console.log(
            `🚨 PRODUCT MANUALLY SET OUT OF STOCK: ${product.title} (${productId}) - Stock changed from ${currentStock} to 0`
          );

          return {
            success: true,
            message: "Product set out of stock successfully",
            previousStock: currentStock,
            newStock: 0,
            productTitle: product.title,
          };
        } catch (error) {
          // If any error occurs, the transaction will be automatically rolled back
          console.error("Transaction failed:", error);
          throw error;
        }
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Set out of stock error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Rate limit exceeded")) {
        return NextResponse.json(
          {
            error:
              "Service temporarily unavailable. Please try again in a moment.",
          },
          { status: 503 }
        );
      }
      if (error.message.includes("Product not found")) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
      if (error.message.includes("Invalid product type")) {
        return NextResponse.json(
          { error: "Invalid product type" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to set product out of stock" },
      { status: 500 }
    );
  }
}
