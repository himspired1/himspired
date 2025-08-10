export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { AdminAuth } from "@/lib/admin-auth";
import { z } from "zod";
import { rateLimiter, RATE_LIMIT_CONFIGS } from "@/lib/rate-limiter";

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Check rate limit using the existing rateLimiter utility
  const rateLimit = await rateLimiter.checkRateLimit(
    ip,
    RATE_LIMIT_CONFIGS.AUTH
  );
  if (!rateLimit.allowed) {
    const now = Date.now();
    const remainingMs = rateLimit.resetTime - now;
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));

    // Create response with proper headers
    const response = NextResponse.json(
      {
        error: "Too many login attempts. Please try again later.",
        remainingTime: remainingMinutes,
        remainingSeconds: remainingSeconds,
        resetTime: new Date(rateLimit.resetTime).toISOString(),
      },
      { status: 429 }
    );

    // Add Retry-After header with remaining time in seconds (HTTP standard)
    response.headers.set("Retry-After", remainingSeconds.toString());

    return response;
  }

  try {
    // Validate input using Zod
    const body = await req.json();
    const schema = z.object({
      username: z.string().min(1, "Username is required"),
      password: z.string().min(1, "Password is required"),
    });
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }
    const { username, password } = result.data;

    // Use AdminAuth for authentication
    const isAuthenticated = await AdminAuth.authenticate(username, password);

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate a real JWT token
    const token = await AdminAuth.generateToken(username);

    // Set HTTP-only cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // Reset rate limit on successful login
    // rateLimiter.resetRateLimit properly deletes cache entries using cache.delete()
    // instead of setting values to null, ensuring clean cache management
    try {
      await rateLimiter.resetRateLimit(ip, RATE_LIMIT_CONFIGS.AUTH);
    } catch (error) {
      // Log the error but don't fail the authentication
      console.warn("Failed to reset rate limit for IP:", ip, error);
    }

    return response;
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0), // Expire the cookie
  });
  return response;
}

// Check current auth status
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("admin-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const user = await AdminAuth.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({
      authenticated: true,
      user: {
        username: user.username,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Authentication check failed" },
      { status: 500 }
    );
  }
}
