export const runtime = "nodejs";
import { NextResponse, NextRequest } from "next/server";
import { AdminAuth } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    // Use NextRequest's built-in cookie parser
    const token = req.cookies.get("admin-token")?.value;
    if (!token) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }
    const user = await AdminAuth.verifyToken(token);
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
        role: "admin",
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
