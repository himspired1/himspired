import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Environment validation - will throw if validation fails
const validateEnvironment = () => {
  const requiredEnvVars = {
    JWT_SECRET: process.env.JWT_SECRET,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    NODE_ENV: process.env.NODE_ENV || "development",
  };

  const missing = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  if (!requiredEnvVars.JWT_SECRET || requiredEnvVars.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  return requiredEnvVars as {
    JWT_SECRET: string;
    ADMIN_USERNAME: string;
    ADMIN_PASSWORD: string;
    ADMIN_PASSWORD_HASH: string;
    NODE_ENV: string;
  };
};

const env = validateEnvironment();
const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export interface AdminUser {
  sub: string;
  username: string;
  role: "admin";
  iat?: number;
  exp?: number;
}

export class AdminAuth {
  static async generateToken(username: string): Promise<string> {
    const token = await new SignJWT({
      sub: username,
      username,
      role: "admin" as const,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    return token;
  }

  static async verifyToken(token: string): Promise<AdminUser | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as unknown as AdminUser;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  }

  static async isAuthenticatedFromRequest(
    request: NextRequest
  ): Promise<boolean> {
    try {
      const token = request.cookies.get("admin-token")?.value;
      if (!token) return false;

      const user = await this.verifyToken(token);
      return !!user;
    } catch (error) {
      console.error("Auth check failed:", error);
      return false;
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("admin-token")?.value;
      if (!token) return false;

      const user = await this.verifyToken(token);
      return !!user;
    } catch (error) {
      console.error("Auth check failed:", error);
      return false;
    }
  }

  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  }

  static async authenticate(username: string, password: string) {
    console.log("Auth attempt for:", username);

    const passwordHash = env.ADMIN_PASSWORD_HASH;

    // Only allow configured admin username
    if (username !== env.ADMIN_USERNAME) {
      console.log("Invalid username:", username);
      return false;
    }

    try {
      const result = await this.verifyPassword(password, passwordHash);
      console.log("Password verification:", result ? "success" : "failed");
      return result;
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  }

  static async setAuthCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set("admin-token", token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
  }

  static async clearAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.delete("admin-token");
  }

  static async getUser(): Promise<AdminUser | null> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("admin-token")?.value;
      if (!token) return null;

      return await this.verifyToken(token);
    } catch (error) {
      console.error("Get user failed:", error);
      return null;
    }
  }
}

/**
 * Returns information about the presence and length of authentication environment variables for debugging purposes.
 *
 * @returns An object indicating whether JWT_SECRET and ADMIN_PASSWORD_HASH are set, and the length of JWT_SECRET.
 */
export async function verifyAuthSetup() {
  return {
    hasSecret: !!env.JWT_SECRET,
    hasPasswordHash: !!env.ADMIN_PASSWORD_HASH,
    secretLength: env.JWT_SECRET?.length || 0,
  };
}
