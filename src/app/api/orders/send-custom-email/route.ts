export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { sendCustomOrderEmail } from "@/lib/email";
import { orderService } from "@/lib/order";
import { OrderStatus } from "@/models/order";

export async function POST(req: NextRequest) {
  try {
    const { orderId, email, message, updateStatus } = await req.json();
    if (!orderId || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Optionally update order status
    if (
      updateStatus &&
      [
        "payment_pending",
        "payment_confirmed",
        "shipped",
        "complete",
        "payment_not_confirmed",
        "canceled",
      ].includes(updateStatus)
    ) {
      await orderService.updateOrderStatus(
        orderId,
        updateStatus as OrderStatus
      );
    }

    // Send the custom email
    await sendCustomOrderEmail(email, "Order Update from Himspired", message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Custom email send failed:", error);
    return NextResponse.json(
      { error: "Failed to send custom email" },
      { status: 500 }
    );
  }
}
