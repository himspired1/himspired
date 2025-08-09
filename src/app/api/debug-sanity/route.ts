import { NextResponse } from "next/server";
import { writeClient } from "@/sanity/client";

export async function GET() {
  try {
    // Check environment variables
    const token = process.env.SANITY_API_TOKEN;
    const tokenLoaded = !!token;
    const tokenLength = token ? token.length : 0;
    const tokenStart = token ? token.substring(0, 10) + "..." : "undefined";

    // Test a simple read operation first
    const testProduct = await writeClient.fetch(
      `*[_type == "clothingItem"][0]{_id, title, stock, reservations}`
    );

    // Test a simple write operation (just update a field that shouldn't break anything)
    const updateResult = await writeClient
      .patch(testProduct._id)
      .set({
        // Just add a temporary debug field
        _debug_test: new Date().toISOString(),
      })
      .commit();

    return NextResponse.json({
      success: true,
      message: "Sanity read and write operations successful",
      tokenLoaded,
      tokenLength,
      tokenStart,
      testProduct,
      updateResult,
    });
  } catch (error) {
    console.error("Sanity debug error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        tokenLoaded: !!process.env.SANITY_API_TOKEN,
        tokenLength: process.env.SANITY_API_TOKEN
          ? process.env.SANITY_API_TOKEN.length
          : 0,
        errorDetails: error,
      },
      { status: 500 }
    );
  }
}
