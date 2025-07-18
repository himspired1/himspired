export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendReplyEmail(
  email: string,
  name: string,
  reply: string,
  messageId: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Re: Your Message - ${messageId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #68191E;">HIMSPIRED</h1>
          
          <div style="background: #f8f8f8; padding: 20px; border-radius: 8px;">
            <h2 style="color: #68191E;">Response to Your Message</h2>
            
            <p>Hi ${name},</p>
            
            <div style="background: #fff; padding: 15px; margin: 15px 0; border-left: 4px solid #68191E;">
              <p style="white-space: pre-wrap;">${reply}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 10px; margin: 15px 0; border-radius: 4px;">
              <small style="color: #2e7d32;"><strong>Reference:</strong> ${messageId}</small>
            </div>
            
            <p>Got more questions? Just reply to this email.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #666; font-size: 14px;">
              Best,<br>
              <strong style="color: #68191E;">The Himspired Team</strong>
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await context.params;

    const client = await clientPromise;
    const db = client.db("himspired");
    const collection = db.collection("contact_messages");

    const message = await collection.findOne({ messageId });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Get message failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await context.params;
    const { action, replyMessage } = await req.json();

    const client = await clientPromise;
    const db = client.db("himspired");
    const collection = db.collection("contact_messages");

    const message = await collection.findOne({ messageId });
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (action === "mark_read") {
      await collection.updateOne(
        { messageId },
        { $set: { isRead: true, updatedAt: new Date() } }
      );

      return NextResponse.json({ success: true, message: "Marked as read" });
    }

    if (action === "reply") {
      if (!replyMessage?.trim()) {
        return NextResponse.json(
          { error: "Reply message required" },
          { status: 400 }
        );
      }

      // Try to send email
      const emailSent = await sendReplyEmail(
        message.email,
        message.name,
        replyMessage.trim(),
        messageId
      );

      // Add reply to database
      const newReply = {
        _id: Date.now().toString(),
        message: replyMessage.trim(),
        sentBy: "admin",
        sentAt: new Date(),
        emailSent,
      };

      await collection.updateOne(
        { messageId },
        {
          $push: { replies: newReply } as object,
          $set: { isRead: true, updatedAt: new Date() },
        }
      );

      return NextResponse.json({
        success: true,
        message: emailSent ? "Reply sent!" : "Reply saved (email failed)",
        emailSent,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update failed:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await context.params;

    const client = await clientPromise;
    const db = client.db("himspired");
    const collection = db.collection("contact_messages");

    const result = await collection.deleteOne({ messageId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
