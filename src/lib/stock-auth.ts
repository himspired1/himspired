import { NextRequest } from "next/server";

export class StockAuth {
  private static readonly VALID_TOKENS = new Set(
    [
      process.env.STOCK_MODIFICATION_TOKEN,
      process.env.ADMIN_STOCK_TOKEN,
    ].filter(Boolean)
  ); // Filter out undefined values

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

      // Check if it's a Bearer token
      if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        return this.VALID_TOKENS.has(token);
      }

      // Check if it's a direct token
      return this.VALID_TOKENS.has(authHeader);
    } catch (error) {
      console.error("Error validating stock authorization:", error);
      return false;
    }
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
