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

// Password complexity utility
function isStrongPassword(password: string): boolean {
  // At least 8 chars, one uppercase, one lowercase, one digit, one symbol
  return (
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password) &&
    password.length >= 8
  );
}

// Simple in-memory rate limiting (per IP)
const rateLimits = new Map(); // key: IP, value: { count, firstAttempt }
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();
  let entry = rateLimits.get(ip);
  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    entry = { count: 0, firstAttempt: now };
  }
  entry.count++;
  rateLimits.set(ip, entry);
  if (entry.count > MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }
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
  if (!isStrongPassword(password)) {
    return NextResponse.json(
      {
        error:
          "Password must be at least 8 characters and include uppercase, lowercase, digit, and symbol.",
      },
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
  const nowDate = new Date();
  const result = await db.collection("admin_users").insertOne({
    username,
    passwordHash,
    createdAt: nowDate,
    updatedAt: nowDate,
  });
  return NextResponse.json({ success: true, id: result.insertedId });
}

export async function DELETE(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();
  let entry = rateLimits.get(ip);
  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    entry = { count: 0, firstAttempt: now };
  }
  entry.count++;
  rateLimits.set(ip, entry);
  if (entry.count > MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }
  const isAuth = await AdminAuth.isAuthenticatedFromRequest(req);
  if (!isAuth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  // Prevent deleting if only one admin remains
  const adminCount = await db.collection("admin_users").countDocuments();
  if (adminCount <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the last remaining admin." },
      { status: 400 }
    );
  }
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
