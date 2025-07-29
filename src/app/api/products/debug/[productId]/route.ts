import { NextRequest, NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";
import { AdminAuth } from "@/lib/admin-auth";
import { sanityRateLimiter } from "@/lib/sanity-retry";

// Helper function to validate debug endpoint access
async function validateDebugAccess(
  req: NextRequest
): Promise<{ authorized: boolean; error?: string }> {
  // Check if we're in development environment
  if (process.env.NODE_ENV !== "development") {
    return {
      authorized: false,
      error: "Debug endpoints are only available in development environment",
    };
  }

  // Check admin authentication
  const isAuthenticated = await AdminAuth.isAuthenticatedFromRequest(req);
  if (!isAuthenticated) {
    return {
      authorized: false,
      error: "Admin authentication required for debug access",
    };
  }

  return { authorized: true };
}

// Audit logging function
function logDebugAction(action: string, productId: string, adminUser?: string) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action,
    productId,
    adminUser: adminUser || "unknown",
    environment: process.env.NODE_ENV,
    userAgent: "debug-endpoint",
  };

  console.log("🔍 DEBUG ACTION:", JSON.stringify(logEntry, null, 2));
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    // Validate access (environment + authentication)
    const accessValidation = await validateDebugAccess(req);
    if (!accessValidation.authorized) {
      return NextResponse.json(
        { error: "Unauthorized", message: accessValidation.error },
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

    // Apply rate limiting for debug operations
    const result = await sanityRateLimiter.executeWithRateLimit(
      "debug-product-info",
      async () => {
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
          throw new Error("Product not found");
        }

        // Check if product is reserved
        const isReserved =
          product.reservedUntil && new Date(product.reservedUntil) > new Date();
        const reservedQuantity = product.reservedQuantity || 0;

        // Log debug access
        logDebugAction("debug-info-fetch", productId);

        return {
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
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Debug fetch error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Rate limit exceeded")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
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
    // Validate access (environment + authentication)
    const accessValidation = await validateDebugAccess(req);
    if (!accessValidation.authorized) {
      return NextResponse.json(
        { error: "Unauthorized", message: accessValidation.error },
        { status: 401 }
      );
    }

    const { productId } = await context.params;
    const { action } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // Apply rate limiting for debug actions
    const result = await sanityRateLimiter.executeWithRateLimit(
      "debug-product-action",
      async () => {
        // Get current product state for audit logging
        const currentProduct = await client.fetch(
          `*[_type == "clothingItem" && _id == $productId][0]{
            _id,
            title,
            reservedUntil,
            reservedBy,
            reservedQuantity,
            reservations
          }`,
          { productId }
        );

        if (!currentProduct) {
          throw new Error("Product not found");
        }

        // Log the debug action with current state
        logDebugAction(`debug-action-${action}`, productId);

        if (action === "clear-reservation") {
          // Clear all reservation-related fields with audit logging
          await writeClient
            .patch(productId)
            .set({
              reservedUntil: null,
              reservedBy: null,
              reservedQuantity: 0,
              reservations: [], // Clear the reservations array as well
            })
            .commit();

          // Log the change with before/after state
          console.log(`🔧 DEBUG RESERVATION CLEARED:`, {
            productId,
            productTitle: currentProduct.title,
            previousReservation: {
              reservedUntil: currentProduct.reservedUntil,
              reservedBy: currentProduct.reservedBy,
              reservedQuantity: currentProduct.reservedQuantity,
              reservationsCount: currentProduct.reservations?.length || 0,
            },
            clearedAt: new Date().toISOString(),
          });

          return {
            success: true,
            message: "Reservation cleared manually",
            action: "clear-reservation",
            productId,
            previousState: {
              reservedUntil: currentProduct.reservedUntil,
              reservedBy: currentProduct.reservedBy,
              reservedQuantity: currentProduct.reservedQuantity,
              reservationsCount: currentProduct.reservations?.length || 0,
            },
          };
        }

        throw new Error(`Invalid action: ${action}`);
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Debug action error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Rate limit exceeded")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      if (error.message.includes("Product not found")) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
      if (error.message.includes("Invalid action")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to perform debug action" },
      { status: 500 }
    );
  }
}
