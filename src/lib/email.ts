import nodemailer from "nodemailer";
import { escape } from "html-escaper";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

type OrderItem = {
  title: string;
  size?: string;
  quantity: number;
  price: number;
};

export const sendOrderConfirmationEmail = async (
  email: string,
  name: string,
  orderId: string,
  orderItems: OrderItem[],
  total: number
) => {
  try {
    const itemsList = orderItems
      .map(
        (item) =>
          `<li style="margin: 10px 0; padding: 10px; background: #f9f9f9;">
        <strong>${escape(item.title)}</strong><br>
        <span style="color: #666; font-size: 14px;">Size: ${escape(item.size || "N/A")} | Qty: ${item.quantity} | ₦${item.price.toLocaleString()}</span>
      </li>`
      )
      .join("");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Order Received - Order ${escape(orderId)}`,
      html: `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
         <div style="text-align: center; margin-bottom: 30px;">
           <h1 style="color: #68191E; margin: 0;">HIMSPIRED</h1>
         </div>
         <div style="background: #f8f8f8; padding: 25px; border-radius: 8px;">
           <h2 style="color: #68191E;">Order Received Successfully!</h2>
           <p>Dear ${escape(name)},</p>
           <p>Thank you for your order! We've successfully received your order <strong>${escape(orderId)}</strong>.</p>
           <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #68191E;">
             <p style="margin: 0;"><strong>What's Next:</strong> We're reviewing your payment and will confirm it within 24-48 hours.</p>
           </div>
           <h3>Order Summary:</h3>
           <ul style="list-style: none; padding: 0;">${itemsList}</ul>
           <div style="background: #fff; padding: 15px; margin: 20px 0; text-align: right;">
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
           <p>You'll receive email updates at each step. If you have any questions, feel free to contact us.</p>
           <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
           <p style="color: #666; font-size: 14px; margin: 0;">
             Thank you for choosing Himspired!<br>
             <strong style="color: #68191E;">The Himspired Team</strong><br>
             <span style="font-size: 12px;">Order ID: ${escape(orderId)}</span>
           </p>
         </div>
       </div>
     `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Order confirmation email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Email send failed:", error);
    throw new Error("Failed to send order confirmation email");
  }
};

export const sendPaymentIssueEmail = async (
  email: string,
  name: string,
  orderId: string
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Payment Issue - Order ${escape(orderId)}`,
      html: `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
         <div style="text-align: center; margin-bottom: 30px;">
           <h1 style="color: #68191E; margin: 0;">HIMSPIRED</h1>
         </div>
         <div style="background: #f8f8f8; padding: 25px; border-radius: 8px;">
           <h2 style="color: #68191E;">Payment Issue Notice</h2>
           <p>Dear ${escape(name)},</p>
           <p>We noticed an issue with your payment for order <strong>${escape(orderId)}</strong>.</p>
           <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #68191E;">
             <p style="margin: 0;"><strong>Action Required:</strong> Please contact your bank to resolve this transaction issue.</p>
           </div>
           <p>If you need assistance, please reply to this email or contact our support team.</p>
           <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
           <p style="color: #666; font-size: 14px; margin: 0;">
             Best regards,<br>
             <strong style="color: #68191E;">The Himspired Team</strong>
           </p>
         </div>
       </div>
     `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Payment issue email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Email send failed:", error);
    throw new Error("Failed to send payment issue email");
  }
};

export const sendPaymentConfirmationEmail = async (
  email: string,
  name: string,
  orderId: string,
  orderItems: OrderItem[],
  total: number
) => {
  try {
    const itemsList = orderItems
      .map(
        (item) =>
          `<li style="margin: 10px 0; padding: 10px; background: #f9f9f9;">
        <strong>${escape(item.title)}</strong><br>
        <span style="color: #666; font-size: 14px;">Size: ${escape(item.size || "N/A")} | Qty: ${item.quantity} | ₦${item.price.toLocaleString()}</span>
      </li>`
      )
      .join("");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Payment Confirmed - Order ${escape(orderId)}`,
      html: `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
         <div style="text-align: center; margin-bottom: 30px;">
           <h1 style="color: #68191E; margin: 0;">HIMSPIRED</h1>
         </div>
         <div style="background: #f8f8f8; padding: 25px; border-radius: 8px;">
           <h2 style="color: #28a745;">Payment Confirmed!</h2>
           <p>Dear ${escape(name)},</p>
           <p>Great news! Your payment for order <strong>${escape(orderId)}</strong> has been confirmed.</p>
           <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #28a745;">
             <p style="margin: 0;"><strong>Status:</strong> Your order is now being processed and will be shipped soon.</p>
           </div>
           <h3>Order Summary:</h3>
           <ul style="list-style: none; padding: 0;">${itemsList}</ul>
           <div style="background: #fff; padding: 15px; margin: 20px 0; text-align: right;">
             <strong style="font-size: 18px; color: #68191E;">Total: ₦${total.toLocaleString()}</strong>
           </div>
           <p>You'll receive another email when your order ships.</p>
           <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
           <p style="color: #666; font-size: 14px; margin: 0;">
             Thank you for choosing Himspired!<br>
             <strong style="color: #68191E;">The Himspired Team</strong>
           </p>
         </div>
       </div>
     `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Payment confirmation sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Email send failed:", error);
    throw new Error("Failed to send payment confirmation email");
  }
};

export const sendOrderShippedEmail = async (
  email: string,
  name: string,
  orderId: string
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Order Shipped - Order ${escape(orderId)}`,
      html: `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
         <div style="text-align: center; margin-bottom: 30px;">
           <h1 style="color: #68191E; margin: 0;">HIMSPIRED</h1>
         </div>
         <div style="background: #f8f8f8; padding: 25px; border-radius: 8px;">
           <h2 style="color: #007bff;">Your Order is On Its Way!</h2>
           <p>Dear ${escape(name)},</p>
           <p>Your order <strong>${escape(orderId)}</strong> has been shipped and is on its way to you.</p>
           <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #007bff;">
             <p style="margin: 0;">
               <strong>Status:</strong> Shipped<br>
               <strong>Expected Delivery:</strong> 3-5 business days
             </p>
           </div>
           <p>You'll receive a final confirmation email once your order is delivered.</p>
           <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
           <p style="color: #666; font-size: 14px; margin: 0;">
             Thank you for your patience!<br>
             <strong style="color: #68191E;">The Himspired Team</strong>
           </p>
         </div>
       </div>
     `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Shipped email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Email send failed:", error);
    throw new Error("Failed to send order shipped email");
  }
};

export const sendOrderCompletionEmail = async (
  email: string,
  name: string,
  orderId: string,
  orderItems: OrderItem[],
  total: number
) => {
  try {
    const itemsList = orderItems
      .map(
        (item) =>
          `<li style="margin: 10px 0; padding: 10px; background: #f9f9f9;">
        <strong>${escape(item.title)}</strong><br>
        <span style="color: #666; font-size: 14px;">Size: ${escape(item.size || "N/A")} | Qty: ${item.quantity} | ₦${item.price.toLocaleString()}</span>
      </li>`
      )
      .join("");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Order Delivered - Order ${escape(orderId)}`,
      html: `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
         <div style="text-align: center; margin-bottom: 30px;">
           <h1 style="color: #68191E; margin: 0;">HIMSPIRED</h1>
         </div>
         <div style="background: #f8f8f8; padding: 25px; border-radius: 8px;">
           <h2 style="color: #6f42c1;">Order Completed!</h2>
           <p>Dear ${escape(name)},</p>
           <p>Your order <strong>${escape(orderId)}</strong> has been successfully delivered and completed.</p>
           <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #6f42c1;">
             <p style="margin: 0;"><strong>Order Status:</strong> Delivered & Complete</p>
           </div>
           <h3>What You Received:</h3>
           <ul style="list-style: none; padding: 0;">${itemsList}</ul>
           <div style="background: #fff; padding: 15px; margin: 20px 0; text-align: right;">
             <strong style="font-size: 18px; color: #68191E;">Total: ₦${total.toLocaleString()}</strong>
           </div>
           <div style="background: #e7f3ff; padding: 20px; margin: 20px 0; border-radius: 8px;">
             <h4 style="color: #0066cc; margin-top: 0;">We'd Love Your Feedback!</h4>
             <p style="margin-bottom: 15px;">How was your Himspired experience? Your feedback helps us improve.</p>
             <a href="mailto:${process.env.EMAIL_USER}?subject=Feedback for Order ${escape(orderId)}"
                style="background: #68191E; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
               Share Feedback
             </a>
           </div>
           <p>Thank you for choosing Himspired! We hope you love your new items.</p>
           <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
           <p style="color: #666; font-size: 14px; margin: 0;">
             Stay stylish!<br>
             <strong style="color: #68191E;">The Himspired Team</strong>
           </p>
         </div>
       </div>
     `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Completion email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Email send failed:", error);
    throw new Error("Failed to send order completion email");
  }
};

export const sendCustomOrderEmail = async (
  email: string,
  subject: string,
  message: string
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: escape(subject),
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #68191E; margin: 0;">HIMSPIRED</h1>
        </div>
        <div style="background: #f8f8f8; padding: 25px; border-radius: 8px;">
          <p>${escape(message).replace(/\n/g, "<br>")}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            Best regards,<br>
            <strong style="color: #68191E;">The Himspired Team</strong>
          </p>
        </div>
      </div>`,
    };
    const result = await transporter.sendMail(mailOptions);
    console.log("Custom order email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Custom email send failed:", error);
    throw new Error("Failed to send custom order email");
  }
};
