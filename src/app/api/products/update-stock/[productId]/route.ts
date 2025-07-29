import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    // Simple token-based authentication
    const authHeader = req.headers.get("authorization");
    const expectedToken =
      process.env.STOCK_MODIFICATION_TOKEN || "admin-stock-token";
    console.log("🪪 Expected token:", expectedToken);
    console.log("🪪 Received auth header:", authHeader);

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Valid token required to update stock",
        },
        { status: 401 }
      );
    }

    const { productId } = await context.params;
    const { newStock } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (typeof newStock !== "number" || newStock < 0) {
      return NextResponse.json(
        { error: "Valid new stock value is required" },
        { status: 400 }
      );
    }

    try {
      // Direct patch without transaction
      await writeClient.patch(productId).set({ stock: newStock }).commit();

      console.log(`✅ Stock updated to ${newStock} for product ${productId}`);

      return NextResponse.json({
        success: true,
        message: "Stock updated successfully",
        newStock: newStock,
        productId: productId,
      });
    } catch (error) {
      console.error("Stock update error:", error);
      return NextResponse.json(
        { error: "Failed to update stock" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Stock update error:", error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}
