import { NextResponse, NextRequest } from "next/server";
import { writeClient, client } from "@/sanity/client";
import { AdminAuth } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  // Security guard: Only allow access in development or with admin authentication
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isDevelopment) {
    // In production, require admin authentication
    try {
      const token = req.cookies.get("admin-token")?.value;
      if (!token) {
        return NextResponse.json(
          { error: "Admin authentication required" },
          { status: 401 }
        );
      }

      const user = await AdminAuth.verifyToken(token);
      if (!user) {
        return NextResponse.json(
          { error: "Invalid admin token" },
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }
  }

  try {
    // Check if Sanity token is available (without exposing details)
    const tokenAvailable = !!process.env.SANITY_API_TOKEN;

    // Test a simple read operation first using read client to reduce token usage
    const testProduct = await client.fetch(
      `*[_type == "clothingItem"][0]{_id, title, stock, reservations}`
    );

    // Check if a product was found before attempting write operations
    if (!testProduct || !testProduct._id) {
      return NextResponse.json(
        {
          success: false,
          error: "No products found for testing",
          tokenAvailable,
          message:
            "Read operation successful, but no products exist to test write operations",
        },
        { status: 404 }
      );
    }

    // Test write operations without leaving permanent changes
    // First, set a temporary debug field
    const setDebugResult = await writeClient
      .patch(testProduct._id)
      .set({
        _debug_test: new Date().toISOString(),
      })
      .commit();

    // Immediately remove the debug field to prevent pollution
    const removeDebugResult = await writeClient
      .patch(testProduct._id)
      .unset(["_debug_test"])
      .commit();

    return NextResponse.json({
      success: true,
      message:
        "Sanity read and write operations successful - no permanent changes made",
      tokenAvailable,
      testProduct,
      writeOperations: {
        setDebug: setDebugResult,
        removeDebug: removeDebugResult,
      },
    });
  } catch (error) {
    // Log the full error for debugging (server-side only)
    console.error("Sanity debug error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Sanity operation failed",
        tokenAvailable: !!process.env.SANITY_API_TOKEN,
      },
      { status: 500 }
    );
  }
}
