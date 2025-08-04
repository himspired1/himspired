export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { AdminAuth } from "@/lib/admin-auth";
import { z } from "zod";
import { cacheService } from "@/lib/cache-service";

// Redis-based rate limiting (per IP)
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Rate limiting helper functions
async function checkRateLimit(
  ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const rateLimitKey = `admin_auth:${ip}`;

  try {
    const cached = await cacheService.getRateLimitCache(rateLimitKey);
    let entry = cached as { count: number; firstAttempt: number } | null;

    if (!entry || now - entry.firstAttempt > WINDOW_MS) {
      entry = { count: 0, firstAttempt: now };
    }

    entry.count++;
    const remaining = Math.max(0, MAX_ATTEMPTS - entry.count);
    const allowed = entry.count <= MAX_ATTEMPTS;

    // Store updated entry in Redis
    await cacheService.setRateLimitCache(
      rateLimitKey,
      entry,
      Math.ceil(WINDOW_MS / 1000)
    );

    return { allowed, remaining };
  } catch (error) {
    console.warn("Rate limit check failed, allowing request:", error);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }
}

async function resetRateLimit(ip: string): Promise<void> {
  const rateLimitKey = `admin_auth:${ip}`;
  try {
    await cacheService.setRateLimitCache(rateLimitKey, null, 1); // Delete by setting short TTL
  } catch (error) {
    console.warn("Failed to reset rate limit:", error);
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Check rate limit
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many login attempts. Please try again later.",
        remainingTime: Math.ceil(WINDOW_MS / 1000 / 60), // minutes
      },
      { status: 429 }
    );
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

    // Reset attempts on successful login
    await resetRateLimit(ip);

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
