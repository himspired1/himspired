export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { sendPaymentIssueEmail } from "@/lib/email";
import { orderService } from "@/lib/order";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const order = await orderService.getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await sendPaymentIssueEmail(
      order.customerInfo.email,
      order.customerInfo.name,
      order.orderId
    );

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Email send failed:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
