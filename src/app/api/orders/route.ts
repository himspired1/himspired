export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/lib/order";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { validateFile } from "@/lib/file-upload";
import { OrderStatus } from "@/models/order";

// In-memory rate limiting per session or IP
const orderAttempts = new Map(); // key: sessionId or IP, value: { count, firstAttempt }
const MAX_ORDERS_PER_SESSION = 3;
const MAX_ORDERS_PER_IP = 100;
const WINDOW_MS = 30 * 60 * 1000; // 30 minutes

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const sessionId = formData.get("sessionId") as string;
  const ip = getClientIp(req);
  const now = Date.now();

  // Per-session rate limiting
  if (sessionId) {
    let entry = orderAttempts.get(sessionId);
    if (!entry || now - entry.firstAttempt > WINDOW_MS) {
      entry = { count: 0, firstAttempt: now };
    }
    entry.count++;
    orderAttempts.set(sessionId, entry);
    if (entry.count > MAX_ORDERS_PER_SESSION) {
      return NextResponse.json(
        {
          error:
            "Too many orders submitted from this session. Please try again later.",
        },
        { status: 429 }
      );
    }
  }

  // Per-IP rate limiting (much higher limit)
  let ipEntry = orderAttempts.get(ip);
  if (!ipEntry || now - ipEntry.firstAttempt > WINDOW_MS) {
    ipEntry = { count: 0, firstAttempt: now };
  }
  ipEntry.count++;
  orderAttempts.set(ip, ipEntry);
  if (ipEntry.count > MAX_ORDERS_PER_IP) {
    return NextResponse.json(
      {
        error:
          "Too many orders submitted from this network. Please try again later.",
      },
      { status: 429 }
    );
  }

  try {
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const state = formData.get("state") as string;
    const message = formData.get("message") as string;
    const items = JSON.parse(formData.get("items") as string);
    const total = parseFloat(formData.get("total") as string);
    const email = (formData.get("email") as string)?.toLowerCase();

    if (!name || !phone || !items || !total) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File;
    let receiptUrl = "";

    if (file) {
      const validation = validateFile(file);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // --- Virus scanning placeholder ---
      // TODO: Integrate with a real virus scanning service (e.g., ClamAV, VirusTotal API)
      // Example:
      // const isClean = await scanFileForViruses(file);
      // if (!isClean) {
      //   return NextResponse.json({ error: 'Uploaded file failed virus scan.' }, { status: 400 });
      // }
      // --- End virus scanning placeholder ---

      try {
        const hasCloudinary = !!(
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
        );

        if (hasCloudinary) {
          receiptUrl = await uploadToCloudinary(file);
        } else {
          // No local fallback in production
          return NextResponse.json(
            {
              error:
                "File upload service not configured. Please try again later.",
            },
            { status: 500 }
          );
        }
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
        return NextResponse.json(
          {
            error: "Failed to upload receipt. Please try again.",
            details:
              uploadError instanceof Error
                ? uploadError.message
                : "Upload failed",
          },
          { status: 500 }
        );
      }
    }

    const order = await orderService.createOrder({
      customerInfo: { name, email, phone, address, state },
      items,
      total,
      message,
      sessionId, // Include sessionId for checkout session cleanup
    });

    if (receiptUrl) {
      await orderService.uploadPaymentReceipt(order.orderId, receiptUrl);
    }

    // Validate email before sending confirmation
    const isValidEmail = (email: string): boolean => {
      if (!email || typeof email !== "string" || email.trim() === "") {
        return false;
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email.trim());
    };

    // Send automatic order confirmation email
    if (isValidEmail(email)) {
      try {
        const { sendOrderConfirmationEmail } = await import("@/lib/email");
        await sendOrderConfirmationEmail(
          email,
          name,
          order.orderId,
          items,
          total
        );
        console.log(
          `✅ Order confirmation email sent for order ${order.orderId}`
        );
      } catch (emailError) {
        console.error(
          `❌ Failed to send order confirmation email for order ${order.orderId}:`,
          emailError
        );
        // Don't fail the order creation if email fails
      }
    } else {
      console.warn(
        `⚠️ Skipping order confirmation email for order ${order.orderId}: Invalid or missing email address (${email})`
      );
    }

    return NextResponse.json({ success: true, orderId: order.orderId });
  } catch (error) {
    console.error("Order submission failed:", error);
    return NextResponse.json(
      { error: "Order submission failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const isValidStatus = (status: string | null): status is OrderStatus => {
      if (!status) return false;
      return [
        "payment_pending",
        "payment_confirmed",
        "shipped",
        "complete",
      ].includes(status);
    };

    const status = isValidStatus(statusParam) ? statusParam : undefined;
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 20;

    const result = await orderService.getOrders(status ? { status } : {}, {
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
