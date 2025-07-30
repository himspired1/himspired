import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/client";
import { sanityRateLimiter } from "@/lib/sanity-retry";
import { StockAuth } from "@/lib/stock-auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    // Authorization check - verify the request is authorized to modify stock
    const isAuthorized = await StockAuth.isAuthorized(req);

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            "Authorization header required for stock modification. Please provide a valid authorization token.",
        },
        { status: 401 }
      );
    }

    const { productId } = await context.params;
    const { quantity = 1 } = await req.json();

    // Validate quantity parameter
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid quantity",
          message: "Quantity must be a positive integer greater than zero.",
        },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Use rate limiting and retry logic for Sanity operations
    const result = await sanityRateLimiter.executeWithRateLimit(
      "decrement-stock",
      async () => {
        // Start a transaction to ensure atomicity
        const transaction = writeClient.transaction();

        try {
          // Fetch product before the transaction
          const product = await writeClient.fetch(
            `*[_type == "clothingItem" && _id == $productId][0]`,
            { productId }
          );

          if (!product) {
            throw new Error("Product not found");
          }

          // Validate that it's a clothing item
          if (product._type !== "clothingItem") {
            throw new Error("Invalid product type");
          }

          // Calculate new stock
          const currentStock = product.stock || 0;
          const newStock = Math.max(0, currentStock - quantity);

          // Log the operation
          console.log(
            `Attempting to decrement stock for product: ${productId}`
          );

          // Patch the product within the same transaction
          transaction.patch(productId, (patch) =>
            patch.set({ stock: newStock })
          );

          // Commit the transaction atomically
          await transaction.commit();

          console.log(`✅ Stock updated: ${currentStock} -> ${newStock}`);

          // Log if product is now permanently out of stock
          if (newStock === 0) {
            console.log(
              `🚨 PRODUCT PERMANENTLY OUT OF STOCK: ${product.title} (${productId}) - Manual restock required in Sanity`
            );
          }

          return {
            success: true,
            message: "Stock updated successfully",
            previousStock: currentStock,
            newStock: newStock,
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
    console.error("Stock decrement error:", error);

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
    }

    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}
