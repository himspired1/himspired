import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

/**
 * Handles GET requests to retrieve paginated contact messages with statistics and pagination metadata.
 *
 * Parses `page` and `limit` query parameters to paginate results, fetches messages from the database, and computes statistics such as total messages, unread count, replied count, and messages received in the last 24 hours. Returns a JSON response containing the messages, statistics, and pagination details.
 *
 * @param req - The incoming HTTP request containing optional `page` and `limit` query parameters
 * @returns A JSON response with success status, messages, statistics, and pagination metadata
 */
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

    const stats = {
      total: totalCount,
      unread: messages.filter((msg) => !msg.isRead).length,
      replied: messages.filter((msg) => msg.replies?.length > 0).length,
      recent: messages.filter((msg) => new Date(msg.createdAt) >= yesterday)
        .length,
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

/**
 * Handles submission of a new contact message via POST request.
 *
 * Validates input fields, enforces a rate limit of one message per email per day, and stores the message in the database. Returns a success response with the message ID on success, or an error response if validation fails, the rate limit is exceeded, or an internal error occurs.
 */
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
