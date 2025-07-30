import { NextResponse } from "next/server";
import { SessionManager } from "@/lib/session";

/**
 * Clear Session Endpoint
 *
 * This endpoint clears the user's session, which is useful when:
 * - Payment is confirmed and reservations should be cleared
 * - User wants to reset their session
 * - Session cleanup is needed
 *
 * Usage: POST /api/session/clear
 */
export async function POST() {
  try {
    // Clear the session
    SessionManager.clearSession();

    console.log("✅ User session cleared successfully");

    return NextResponse.json({
      success: true,
      message: "Session cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error clearing session:", error);
    return NextResponse.json(
      { error: "Failed to clear session" },
      { status: 500 }
    );
  }
}

/**
 * Get Session Status Endpoint
 *
 * This endpoint returns the current session status for debugging purposes.
 *
 * Usage: GET /api/session/clear
 */
export async function GET() {
  try {
    const sessionId = SessionManager.getSessionId();
    const isValid = SessionManager.isSessionValid();

    return NextResponse.json({
      success: true,
      sessionId,
      isValid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting session status:", error);
    return NextResponse.json(
      { error: "Failed to get session status" },
      { status: 500 }
    );
  }
}
