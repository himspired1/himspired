import { NextRequest, NextResponse } from "next/server";
import { StockAuth } from "@/lib/stock-auth";
import { forceCleanupProducts } from "@/lib/product-cleanup";

// Simple rate limiting for admin cleanup operations
const adminCleanupAttempts = new Map<
  string,
  { count: number; firstAttempt: number }
>();
const MAX_CLEANUP_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

interface ForceCleanupRequest {
  productIds: string[];
  clearAll?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // Simple rate limiting for sensitive cleanup operations
    const clientIp = getClientIp(req);
    const now = Date.now();
    let entry = adminCleanupAttempts.get(clientIp);

    if (!entry || now - entry.firstAttempt > WINDOW_MS) {
      entry = { count: 0, firstAttempt: now };
    }

    entry.count++;
    adminCleanupAttempts.set(clientIp, entry);

    if (entry.count > MAX_CLEANUP_ATTEMPTS) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many cleanup attempts. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Validate environment variables
    StockAuth.validateEnvironmentVariables();

    // Use timing-safe authentication
    const isAuthorized = await StockAuth.isAuthorized(req);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Valid token required to perform force cleanup",
        },
        { status: 401 }
      );
    }

    const { productIds, clearAll = true }: ForceCleanupRequest =
      await req.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "productIds array is required and must not be empty",
        },
        { status: 400 }
      );
    }

    // Validate all product IDs
    for (const productId of productIds) {
      if (typeof productId !== "string" || productId.trim().length === 0) {
        return NextResponse.json(
          {
            error: "Invalid product ID",
            message: "All product IDs must be non-empty strings",
          },
          { status: 400 }
        );
      }
    }

    // Use the shared function instead of making HTTP requests
    const result = await forceCleanupProducts(productIds, clearAll);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Force cleanup API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to perform force cleanup",
      },
      { status: 500 }
    );
  }
}
