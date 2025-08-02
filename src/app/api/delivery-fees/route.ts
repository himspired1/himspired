export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { stateDeliveryService } from "@/lib/state-delivery";
import {
  CreateStateDeliveryFeeRequest,
} from "@/models/state-delivery";
import { states } from "@/data/states";

// Rate limiting for delivery fee operations
const deliveryFeeAttempts = new Map(); // key: IP, value: { count, firstAttempt }
const MAX_ATTEMPTS = 50;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// GET - Get all state delivery fees
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();

  // Rate limiting
  let entry = deliveryFeeAttempts.get(ip);
  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    entry = { count: 0, firstAttempt: now };
  }
  entry.count++;
  deliveryFeeAttempts.set(ip, entry);

  if (entry.count > MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
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
  const ip = getClientIp(req);
  const now = Date.now();

  // Rate limiting
  let entry = deliveryFeeAttempts.get(ip);
  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    entry = { count: 0, firstAttempt: now };
  }
  entry.count++;
  deliveryFeeAttempts.set(ip, entry);

  if (entry.count > MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
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
