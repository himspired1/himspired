import { NextRequest, NextResponse } from "next/server";
import { AdminAuth } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const { username, currentPassword, newPassword } = await req.json();
    if (!username || !currentPassword || !newPassword) {
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
    // Authenticate current password
    const isValid = await AdminAuth.authenticate(username, currentPassword);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }
    // Change password in DB
    const changed = await AdminAuth.changePassword(username, newPassword);
    if (!changed) {
      return NextResponse.json(
        { error: "Failed to update password." },
        { status: 500 }
      );
    }
    // Respond with success and expire the admin-token cookie
    const response = NextResponse.json({
      success: true,
      message: "Password changed. Please log in again.",
    });
    response.cookies.set("admin-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to change password." },
      { status: 500 }
    );
  }
}
