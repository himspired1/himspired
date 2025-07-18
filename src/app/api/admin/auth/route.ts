export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { AdminAuth } from "@/lib/admin-auth";
import { z } from "zod";

// Simple in-memory rate limiting (per IP)
const loginAttempts = new Map(); // key: IP, value: { count, firstAttempt }
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; /**
 * Retrieves the client's IP address from the request headers.
 *
 * Checks the "x-forwarded-for" and "x-real-ip" headers, returning "unknown" if neither is present.
 *
 * @param req - The incoming Next.js request object
 * @returns The client IP address as a string, or "unknown" if not found
 */

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Handles admin login requests with rate limiting and JWT authentication.
 *
 * Accepts a JSON payload with `username` and `password`, enforces a limit of 5 login attempts per IP within a 10-minute window, and authenticates credentials using the AdminAuth service. On successful authentication, issues a JWT token as an HTTP-only cookie valid for 24 hours and resets the attempt counter. Returns appropriate HTTP error responses for rate limiting, invalid credentials, or server errors.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();
  let entry = loginAttempts.get(ip);
  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    entry = { count: 0, firstAttempt: now };
  }
  entry.count++;
  loginAttempts.set(ip, entry);
  if (entry.count > MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
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
    loginAttempts.delete(ip);

    return response;
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

/**
 * Logs out the admin user by clearing the authentication cookie.
 *
 * @returns A JSON response indicating success, with the "admin-token" cookie cleared.
 */
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
