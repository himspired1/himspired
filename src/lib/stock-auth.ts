import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

export class StockAuth {
  private static readonly VALID_TOKENS = [
    process.env.STOCK_MODIFICATION_TOKEN,
    process.env.ADMIN_STOCK_TOKEN,
  ].filter(Boolean) as string[];

  static async isAuthorized(request: NextRequest): Promise<boolean> {
    try {
      const authHeader = request.headers.get("authorization");
      if (!authHeader) {
        console.warn("Stock modification request missing authorization header");
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
      console.error("Error validating stock modification token:", error);
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
    if (
      !process.env.STOCK_MODIFICATION_TOKEN &&
      !process.env.ADMIN_STOCK_TOKEN
    ) {
      throw new Error(
        "STOCK_MODIFICATION_TOKEN or ADMIN_STOCK_TOKEN environment variable must be set"
      );
    }
  }

  static getValidTokens(): string[] {
    return [...this.VALID_TOKENS];
  }
}
