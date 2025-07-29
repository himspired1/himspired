import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

export class StockAuth {
  private static readonly VALID_TOKENS = [
    process.env.STOCK_MODIFICATION_TOKEN,
    process.env.ADMIN_STOCK_TOKEN,
  ].filter(Boolean) as string[]; // Filter out undefined values

  /**
   * Validate if the request is authorized to modify stock
   * @param request - The NextRequest object
   * @returns Promise<boolean> - True if request is authorized
   */
  static async isAuthorized(request: NextRequest): Promise<boolean> {
    try {
      const authHeader = request.headers.get("authorization");

      if (!authHeader) {
        console.warn(
          "Stock modification attempted without authorization header"
        );
        return false;
      }

      // Extract token from header
      let token: string;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      } else {
        token = authHeader;
      }

      // Use timing-safe comparison to prevent timing attacks
      return this.isValidToken(token);
    } catch (error) {
      console.error("Error validating stock authorization:", error);
      return false;
    }
  }

  /**
   * Validate token using timing-safe comparison
   * @param token - The token to validate
   * @returns boolean - True if token is valid
   */
  private static isValidToken(token: string): boolean {
    // Convert token to Buffer for timing-safe comparison
    const tokenBuffer = Buffer.from(token, "utf8");

    // Compare against each valid token using timing-safe comparison
    for (const validToken of this.VALID_TOKENS) {
      const validTokenBuffer = Buffer.from(validToken, "utf8");

      // Use timingSafeEqual to prevent timing attacks
      if (
        tokenBuffer.length === validTokenBuffer.length &&
        timingSafeEqual(tokenBuffer, validTokenBuffer)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get the authorization token from the request
   * @param request - The NextRequest object
   * @returns string | null - The authorization token or null
   */
  static getAuthToken(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return null;
    }

    if (authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    return authHeader;
  }

  /**
   * Log authorization attempt for audit purposes
   * @param request - The NextRequest object
   * @param authorized - Whether the request was authorized
   * @param action - The action being performed
   */
  static logAuthAttempt(
    request: NextRequest,
    authorized: boolean,
    action: string
  ): void {
    const timestamp = new Date().toISOString();
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const logEntry = {
      timestamp,
      action,
      authorized,
      userAgent,
      ip,
      hasAuthHeader: !!request.headers.get("authorization"),
    };

    if (authorized) {
      console.log(`🔐 STOCK AUTH SUCCESS:`, JSON.stringify(logEntry, null, 2));
    } else {
      console.warn(`🚫 STOCK AUTH FAILED:`, JSON.stringify(logEntry, null, 2));
    }
  }
}
