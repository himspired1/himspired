import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {

    const { sessionId } = await req.json();

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Valid session ID is required" },
        { status: 400 }
      );
    }

    // Simple session validation - just check if it's a valid string format
    const isValidSessionId = /^[a-z0-9_-]+$/.test(sessionId);

    if (!isValidSessionId) {
      return NextResponse.json(
        { error: "Invalid session ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Session ID is valid",
      sessionId,
    });
  } catch (error) {
    console.error("Error validating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
