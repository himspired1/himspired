import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { AdminAuth } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Only allow authenticated admins
  const isAuth = await AdminAuth.isAuthenticatedFromRequest(req);
  if (!isAuth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const client = await clientPromise;
  const db = client.db();
  const admins = await db
    .collection("admin_users")
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: 1 })
    .toArray();
  return NextResponse.json({ admins });
}

export async function POST(req: NextRequest) {
  const isAuth = await AdminAuth.isAuthenticatedFromRequest(req);
  if (!isAuth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password required" },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }
  const client = await clientPromise;
  const db = client.db();
  const existing = await db.collection("admin_users").findOne({ username });
  if (existing) {
    return NextResponse.json(
      { error: "Username already exists" },
      { status: 400 }
    );
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const result = await db.collection("admin_users").insertOne({
    username,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json({ success: true, id: result.insertedId });
}

export async function DELETE(req: NextRequest) {
  const isAuth = await AdminAuth.isAuthenticatedFromRequest(req);
  if (!isAuth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  // Prevent deleting the default admin
  const admin = await db
    .collection("admin_users")
    .findOne({ _id: new ObjectId(id) });
  if (admin?.username === "admin") {
    return NextResponse.json(
      { error: "Cannot delete default admin" },
      { status: 400 }
    );
  }
  await db.collection("admin_users").deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ success: true });
}
