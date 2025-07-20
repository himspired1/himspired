import { NextRequest, NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";

export async function GET(
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

    // Get current product info from Sanity
    const product = await client.fetch(
      `*[_type == "clothingItem" && _id == $productId][0]{
        _id,
        title,
        stock,
        reservedUntil,
        reservedBy,
        reservedQuantity
      }`,
      { productId }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if product is reserved
    const isReserved =
      product.reservedUntil && new Date(product.reservedUntil) > new Date();
    const reservedQuantity = product.reservedQuantity || 0;

    return NextResponse.json({
      success: true,
      productId: product._id,
      title: product.title,
      stock: product.stock || 0,
      reservedUntil: product.reservedUntil,
      reservedBy: product.reservedBy,
      reservedQuantity: reservedQuantity,
      isReserved: isReserved,
      currentTime: new Date().toISOString(),
      reservationExpired: product.reservedUntil
        ? new Date(product.reservedUntil) <= new Date()
        : null,
    });
  } catch (error) {
    console.error("Debug fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug information" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;
    const { action } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (action === "clear-reservation") {
      // Clear reservation
      await writeClient
        .patch(productId)
        .set({
          reservedUntil: null,
          reservedBy: null,
        })
        .commit();

      return NextResponse.json({
        success: true,
        message: "Reservation cleared manually",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Debug action error:", error);
    return NextResponse.json(
      { error: "Failed to perform debug action" },
      { status: 500 }
    );
  }
}
