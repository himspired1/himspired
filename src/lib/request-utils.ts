import { NextRequest } from "next/server";

/**
 * Extract client IP address from request headers
 * Handles various proxy configurations and fallbacks
 *
 * @param req - The NextRequest object
 * @returns The client IP address as a string
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
