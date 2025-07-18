export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = Math.min(limitParam ? parseInt(limitParam) : 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("himspired");
    const collection = db.collection("contact_messages");

    // Get total count for pagination metadata
    const totalCount = await collection.countDocuments({});

    // Get paginated messages
    const messages = await collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Calculate stats using the full collection, not just paginated messages
    const [unreadCount, repliedCount, recentCount] = await Promise.all([
      collection.countDocuments({ isRead: false }),
      collection.countDocuments({ "replies.0": { $exists: true } }),
      collection.countDocuments({ createdAt: { $gte: yesterday } }),
    ]);

    const stats = {
      total: totalCount,
      unread: unreadCount,
      replied: repliedCount,
      recent: recentCount,
    };

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      messages,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Get messages failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    // Quick validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      );
    }

    // Simple email check
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("himspired");
    const collection = db.collection("contact_messages");

    // Check rate limit - one message per day
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await collection.findOne({
      email: email.toLowerCase(),
      createdAt: { $gte: yesterday },
    });

    if (recent) {
      return NextResponse.json(
        { error: "Only one message per day allowed", rateLimited: true },
        { status: 429 }
      );
    }

    // Create message
    const messageId = `MSG-${Date.now()}`;
    const contactMessage = {
      messageId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: [],
    };

    await collection.insertOne(contactMessage);

    return NextResponse.json({
      success: true,
      messageId,
      message: "Message sent! We'll get back to you soon.",
    });
  } catch (error) {
    console.error("Contact submit failed:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
