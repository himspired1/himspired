export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { stateDeliveryService } from "@/lib/state-delivery";
import { CreateStateDeliveryFeeRequest } from "@/models/state-delivery";
import { states } from "@/data/states";
import { rateLimiter } from "@/lib/rate-limiter";

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
  const rateLimitResult = await rateLimiter.checkRateLimit(ip, {
    maxAttempts: 50,
    windowMs: 10 * 60 * 1000, // 10 minutes
    keyPrefix: "rate_limit:delivery_fees_bulk",
  });

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

// GET - Get all state delivery fees
export async function GET(req: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await checkRateLimit(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const fees = await stateDeliveryService.getAllStateDeliveryFees();

    return NextResponse.json({
      success: true,
      data: fees,
      total: fees.length,
    });
  } catch (error) {
    console.error("Error getting delivery fees:", error);
    return NextResponse.json(
      { error: "Failed to get delivery fees" },
      { status: 500 }
    );
  }
}

// POST - Create or update state delivery fee
export async function POST(req: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await checkRateLimit(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body: CreateStateDeliveryFeeRequest = await req.json();

    // Validation
    if (!body.state || !states.includes(body.state)) {
      return NextResponse.json(
        { error: "Invalid state. Please provide a valid Nigerian state." },
        { status: 400 }
      );
    }

    if (
      typeof body.deliveryFee !== "number" ||
      body.deliveryFee < 0 ||
      body.deliveryFee > 10000
    ) {
      return NextResponse.json(
        { error: "Delivery fee must be a number between 0 and 10,000." },
        { status: 400 }
      );
    }

    const result = await stateDeliveryService.upsertStateDeliveryFee(body);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to create/update delivery fee" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Delivery fee updated successfully",
    });
  } catch (error) {
    console.error("Error creating/updating delivery fee:", error);
    return NextResponse.json(
      { error: "Failed to create/update delivery fee" },
      { status: 500 }
    );
  }
}
