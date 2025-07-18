import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { AdminAuth } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const isAuth = await AdminAuth.isAuthenticatedFromRequest(req);
  if (!isAuth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id format" }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db();

  // Prevent deleting the last admin
  const adminCount = await db.collection("admin_users").countDocuments();
  if (adminCount <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the last remaining admin." },
      { status: 400 }
    );
  }

  // Prevent deleting the default admin by username
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
