import { NextRequest, NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";
import { sanityRateLimiter } from "@/lib/sanity-retry";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;
    const { quantity = 1 } = await req.json();

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
        // Get current product stock
        const product = await client.fetch(
          `*[_type == "clothingItem" && _id == $productId][0]{
            _id,
            title,
            stock
          }`,
          { productId }
        );

        if (!product) {
          throw new Error("Product not found");
        }

        // Calculate new stock
        const newStock = Math.max(0, product.stock - quantity);

        // Update stock in Sanity
        console.log(`Attempting to decrement stock for product: ${productId}`);
        console.log(
          `Sanity token available: ${!!process.env.SANITY_API_TOKEN}`
        );

        await writeClient.patch(productId).set({ stock: newStock }).commit();
        console.log(`✅ Stock updated: ${product.stock} -> ${newStock}`);

        // Log if product is now permanently out of stock
        if (newStock === 0) {
          console.log(
            `🚨 PRODUCT PERMANENTLY OUT OF STOCK: ${product.title} (${productId}) - Manual restock required in Sanity`
          );
        }

        return {
          success: true,
          message: "Stock updated successfully",
          previousStock: product.stock,
          newStock: newStock,
        };
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
