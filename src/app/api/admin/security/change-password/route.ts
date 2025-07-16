import { NextRequest, NextResponse } from "next/server";
import { AdminAuth } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";

// Simulate updating the environment variable (in production, use a secure store or database)
let simulatedAdminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

export async function POST(req: NextRequest) {
  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }
    // Validate current password
    const isValid = await AdminAuth.verifyPassword(
      currentPassword,
      simulatedAdminPasswordHash!
    );
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }
    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12);
    // Simulate updating the environment variable
    simulatedAdminPasswordHash = newHash;
    process.env.ADMIN_PASSWORD_HASH = newHash;
    // Respond with success
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to change password." },
      { status: 500 }
    );
  }
}
