import { NextRequest, NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Get current product
    const product = await client.fetch(
      `*[_type == "clothingItem" && _id == $productId][0]{
        _id,
        title,
        stock
      }`,
      { productId }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Set stock to 0 (out of stock)
    await writeClient.patch(productId).set({ stock: 0 }).commit();

    console.log(
      `🚨 PRODUCT MANUALLY SET OUT OF STOCK: ${product.title} (${productId}) - Stock changed from ${product.stock} to 0`
    );

    return NextResponse.json({
      success: true,
      message: "Product set out of stock successfully",
      previousStock: product.stock,
      newStock: 0,
    });
  } catch (error) {
    console.error("Set out of stock error:", error);
    return NextResponse.json(
      { error: "Failed to set product out of stock" },
      { status: 500 }
    );
  }
}
