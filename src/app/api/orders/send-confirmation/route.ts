export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/lib/order";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

    const { customerInfo, items, total } = order;

    const itemsList = items
      .map(
        (item) =>
          `<li style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 4px;">
       <strong>${item.title}</strong><br>
       <span style="color: #666; font-size: 14px;">Size: ${item.size || "N/A"} | Qty: ${item.quantity} | ₦${item.price.toLocaleString()}</span>
     </li>`
      )
      .join("");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerInfo.email,
      subject: `Order Received - Order ${orderId}`,
      html: `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
         <div style="text-align: center; margin-bottom: 30px;">
           <h1 style="color: #68191E; margin: 0; font-size: 24px;">HIMSPIRED</h1>
         </div>
         
         <div style="background: #f8f8f8; padding: 25px; border-radius: 8px;">
           <h2 style="color: #68191E; margin-top: 0;">Order Received Successfully!</h2>
           
           <p style="color: #333; line-height: 1.6;">Dear ${customerInfo.name},</p>
           
           <p style="color: #333; line-height: 1.6;">
             Thank you for your order! We've successfully received your order <strong>${orderId}</strong> and your payment receipt.
           </p>
           
           <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #68191E;">
             <p style="margin: 0; color: #333;">
               <strong>What's Next:</strong> We're reviewing your payment and will confirm it within 24-48 hours.
             </p>
           </div>

           <h3 style="color: #333; margin-top: 25px;">Order Summary:</h3>
           <ul style="list-style: none; padding: 0;">
             ${itemsList}
           </ul>

           <div style="background: #fff; padding: 15px; margin: 20px 0; border-radius: 4px; text-align: right;">
             <strong style="font-size: 18px; color: #68191E;">Total: ₦${total.toLocaleString()}</strong>
           </div>

           <div style="background: #e8f5e8; padding: 15px; margin: 20px 0; border-radius: 4px;">
             <h4 style="color: #2e7d32; margin-top: 0;">Order Timeline:</h4>
             <ul style="margin: 0; padding-left: 20px; color: #333;">
               <li> Order received (now)</li>
               <li> Payment verification (24-48 hours)</li>
               <li> Processing & shipping (2-3 days)</li>
               <li> Delivery (3-5 days)</li>
             </ul>
           </div>
           
           <p style="color: #333; line-height: 1.6;">
             You'll receive email updates at each step. If you have any questions, feel free to contact us.
           </p>
           
           <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
           
           <p style="color: #666; font-size: 14px; margin: 0;">
             Thank you for choosing Himspired!<br>
             <strong style="color: #68191E;">The Himspired Team</strong><br>
             <span style="font-size: 12px;">Order ID: ${orderId}</span>
           </p>
         </div>
       </div>
     `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Order received email sent");

    return NextResponse.json({
      success: true,
      message: "Order received email sent successfully",
    });
  } catch (error) {
    console.error("Email send failed:", error);
    return NextResponse.json(
      { error: "Failed to send order received email" },
      { status: 500 }
    );
  }
}
