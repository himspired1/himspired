export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { stateDeliveryService } from "@/lib/state-delivery";
import { UpdateStateDeliveryFeeRequest } from "@/models/state-delivery";
import { states } from "@/data/states";
import { rateLimiter, RATE_LIMIT_CONFIGS } from "@/lib/rate-limiter";

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check rate limit for delivery fee operations
 * @param req - The NextRequest object
 * @returns NextResponse with 429 status if rate limit exceeded, null otherwise
 */
async function checkRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIp(req);

  // Rate limiting using Redis-based rate limiter
  const rateLimitResult = await rateLimiter.checkRateLimit(
    ip,
    RATE_LIMIT_CONFIGS.DELIVERY_FEES
  );

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        resetTime: rateLimitResult.resetTime,
        remaining: rateLimitResult.remaining,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      }
    );
  }

  return null;
}

// GET - Get delivery fee for a specific state
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ state: string }> }
) {
  // Check rate limit
  const rateLimitResponse = await checkRateLimit(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { state } = await params;

    if (!state || !states.includes(state)) {
      return NextResponse.json(
        { error: "Invalid state. Please provide a valid Nigerian state." },
        { status: 400 }
      );
    }

    const fee = await stateDeliveryService.getDeliveryFee(state);

    return NextResponse.json(
      {
        success: true,
        data: {
          state,
          deliveryFee: fee,
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error getting delivery fee for state:", error);
    return NextResponse.json(
      { error: "Failed to get delivery fee" },
      { status: 500 }
    );
  }
}

// PATCH - Update delivery fee for a specific state
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ state: string }> }
) {
  // Check rate limit
  const rateLimitResponse = await checkRateLimit(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { state } = await params;
    const body: UpdateStateDeliveryFeeRequest = await req.json();

    if (!state || !states.includes(state)) {
      return NextResponse.json(
        { error: "Invalid state. Please provide a valid Nigerian state." },
        { status: 400 }
      );
    }

    if (
      body.deliveryFee !== undefined &&
      (typeof body.deliveryFee !== "number" ||
        body.deliveryFee < 0 ||
        body.deliveryFee > 10000)
    ) {
      return NextResponse.json(
        { error: "Delivery fee must be a number between 0 and 10,000." },
        { status: 400 }
      );
    }

    const result = await stateDeliveryService.updateStateDeliveryFee(
      state,
      body
    );

    if (!result) {
      return NextResponse.json(
        { error: "State delivery fee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Delivery fee updated successfully",
    });
  } catch (error) {
    console.error("Error updating delivery fee for state:", error);
    return NextResponse.json(
      { error: "Failed to update delivery fee" },
      { status: 500 }
    );
  }
}

// DELETE - Delete delivery fee for a specific state
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ state: string }> }
) {
  // Check rate limit
  const rateLimitResponse = await checkRateLimit(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { state } = await params;

    if (!state || !states.includes(state)) {
      return NextResponse.json(
        { error: "Invalid state. Please provide a valid Nigerian state." },
        { status: 400 }
      );
    }

    const deleted = await stateDeliveryService.deleteStateDeliveryFee(state);

    if (!deleted) {
      return NextResponse.json(
        { error: "State delivery fee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Delivery fee deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting delivery fee for state:", error);
    return NextResponse.json(
      { error: "Failed to delete delivery fee" },
      { status: 500 }
    );
  }
}
