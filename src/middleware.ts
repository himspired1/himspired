import { NextResponse } from "next/server";

// ⚠️ Do NOT use server-only code (e.g., '@/lib/admin-auth', MongoDB, bcrypt) in middleware.
// Next.js middleware runs in the Edge Runtime and only supports Edge-compatible code.
// Admin authentication must be handled in API routes and client-side checks, not middleware.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(_request: Request) {
  // All admin and API route protection should be handled in API route code and client-side logic.
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
