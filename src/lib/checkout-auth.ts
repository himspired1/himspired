import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

export interface CheckoutSession {
  sessionId: string;
  cartItems: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export class CheckoutAuth {
  private static readonly VALID_TOKENS = [
    process.env.CHECKOUT_TOKEN,
    process.env.ADMIN_CHECKOUT_TOKEN,
  ].filter(Boolean) as string[];

  static async isAuthorized(request: NextRequest): Promise<boolean> {
    try {
      const authHeader = request.headers.get("authorization");
      if (!authHeader) {
        console.warn("Checkout request missing authorization header");
        return false;
      }

      let token: string;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      } else {
        token = authHeader;
      }

      return this.isValidToken(token);
    } catch (error) {
      console.error("Error validating checkout token:", error);
      return false;
    }
  }

  private static isValidToken(token: string): boolean {
    const tokenBuffer = Buffer.from(token, "utf8");

    for (const validToken of this.VALID_TOKENS) {
      const validTokenBuffer = Buffer.from(validToken, "utf8");

      if (
        tokenBuffer.length === validTokenBuffer.length &&
        timingSafeEqual(tokenBuffer, validTokenBuffer)
      ) {
        return true;
      }
    }

    return false;
  }

  static validateEnvironmentVariables(): void {
    if (!process.env.CHECKOUT_TOKEN && !process.env.ADMIN_CHECKOUT_TOKEN) {
      throw new Error(
        "CHECKOUT_TOKEN or ADMIN_CHECKOUT_TOKEN environment variable must be set"
      );
    }
  }

  static getValidTokens(): string[] {
    return [...this.VALID_TOKENS];
  }

  /**
   * Safely get the first valid token
   * @throws Error if no valid tokens are available
   */
  static getFirstValidToken(): string {
    if (this.VALID_TOKENS.length === 0) {
      throw new Error("No valid checkout tokens available");
    }
    return this.VALID_TOKENS[0];
  }

  /**
   * Check if any valid tokens are available
   */
  static hasValidTokens(): boolean {
    return this.VALID_TOKENS.length > 0;
  }

  /**
   * Deactivate a checkout session
   */
  static async deactivateCheckoutSession(sessionId: string): Promise<boolean> {
    try {
      // Get the base URL for API calls
      const baseUrl =
        process.env.BASE_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "http://localhost:3000";

      const response = await fetch(`${baseUrl}/api/session/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getFirstValidToken()}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      return response.ok;
    } catch (error) {
      console.error("Error deactivating checkout session:", error);
      return false;
    }
  }

  /**
   * Release a product reservation
   */
  static async releaseProductReservation(itemData: {
    productId: string;
    sessionId?: string;
    quantity?: number;
  }): Promise<boolean> {
    try {
      // Get the base URL for API calls
      const baseUrl =
        process.env.BASE_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "http://localhost:3000";

      const response = await fetch(
        `${baseUrl}/api/products/release/${itemData.productId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.getFirstValidToken()}`,
          },
          body: JSON.stringify({
            sessionId: itemData.sessionId,
            quantity: itemData.quantity,
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Error releasing product reservation:", error);
      return false;
    }
  }
}
