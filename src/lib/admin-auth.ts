import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import clientPromise from "./mongodb";
import { AdminUser } from "@/models/admin";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export class AdminAuth {
  static async getAdminByUsername(username: string): Promise<AdminUser | null> {
    const client = await clientPromise;
    const db = client.db();
    return db.collection<AdminUser>("admin_users").findOne({ username });
  }

  static async authenticate(
    username: string,
    password: string
  ): Promise<boolean> {
    const admin = await this.getAdminByUsername(username);
    if (!admin) return false;
    return bcrypt.compare(password, admin.passwordHash);
  }

  static async generateToken(username: string): Promise<string> {
    const admin = await this.getAdminByUsername(username);
    if (!admin) throw new Error("Admin not found");
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
      if (!payload || typeof payload !== "object" || !payload.username)
        return null;
      const admin = await this.getAdminByUsername(payload.username as string);
      if (!admin) return null;
      return admin;
    } catch {
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
    } catch {
      return false;
    }
  }

  static async setAuthCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
  }
}
