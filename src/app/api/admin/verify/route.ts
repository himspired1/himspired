import { NextResponse } from "next/server";
import { AdminAuth } from "@/lib/admin-auth";

/**
 * Handles a GET request to verify admin user authentication status.
 *
 * Returns a JSON response indicating whether the user is authenticated. If authenticated, includes the user's username and role. Responds with appropriate HTTP status codes for unauthenticated or error conditions.
 */
export async function GET() {
  try {
    const user = await AdminAuth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);

    return NextResponse.json(
      {
        authenticated: false,
        error: "Verification failed",
      },
      { status: 500 }
    );
  }
}
