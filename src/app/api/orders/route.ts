import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/lib/order";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { validateFile } from "@/lib/file-upload";
import { OrderStatus } from "@/models/order";

// In-memory rate limiting per IP
const orderAttempts = new Map(); // key: IP, value: { count, firstAttempt }
const MAX_ORDERS = 3;
const WINDOW_MS = 30 * 60 * 1000; /**
 * Extracts the client IP address from the request headers.
 *
 * Checks the "x-forwarded-for" and "x-real-ip" headers in order, returning "unknown" if neither is present.
 *
 * @returns The client IP address as a string, or "unknown" if not available.
 */

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Handles order submission requests with rate limiting, form data validation, optional file upload, and order creation.
 *
 * Enforces a maximum number of orders per client IP within a 30-minute window. Accepts multipart form data containing customer information, order items, total amount, and an optional file upload (e.g., payment receipt). Validates required fields and uploaded files. If a file is provided and Cloudinary is configured, uploads the file and associates its URL with the order. Returns a JSON response with the order ID on success, or an error message with appropriate HTTP status on failure.
 */
export async function POST(req: NextRequest) {
  // Rate limiting logic
  const ip = getClientIp(req);
  const now = Date.now();
  let entry = orderAttempts.get(ip);
  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    entry = { count: 0, firstAttempt: now };
  }
  entry.count++;
  orderAttempts.set(ip, entry);
  if (entry.count > MAX_ORDERS) {
    return NextResponse.json(
      { error: "Too many orders submitted. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const message = formData.get("message") as string;
    const items = JSON.parse(formData.get("items") as string);
    const total = parseFloat(formData.get("total") as string);

    if (!name || !email || !items || !total) {
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
      customerInfo: { name, email, phone, address },
      items,
      total,
      message,
    });

    if (receiptUrl) {
      await orderService.uploadPaymentReceipt(order.orderId, receiptUrl);
    }

    // Email confirmation is no longer sent here. This responsibility has been moved to the admin UI.
    // See: src/app/admin/orders/page.tsx at line 436, where sendEmail(order.orderId) is called from the client side.
    return NextResponse.json({ success: true, orderId: order.orderId });
  } catch (error) {
    console.error("Order submission failed:", error);
    return NextResponse.json(
      { error: "Order submission failed" },
      { status: 500 }
    );
  }
}

/**
 * Handles GET requests to retrieve orders with optional status filtering and pagination.
 *
 * Supports filtering by order status and paginating results using `page` and `limit` query parameters. Returns a JSON response containing the paginated list of orders and associated metadata.
 */
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
