import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendContactConfirmation = async (
  email: string,
  name: string,
  messageId: string
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Message Received - ${messageId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #68191E;">HIMSPIRED</h1>
        
        <div style="background: #f8f8f8; padding: 20px; border-radius: 8px;">
          <h2 style="color: #68191E;">Message Received!</h2>
          
          <p>Hi ${name},</p>
          
          <p>Thanks for reaching out! We got your message and will get back to you within 24-48 hours.</p>
          
          <div style="background: #fff; padding: 15px; margin: 15px 0; border-left: 4px solid #68191E;">
            <strong>Reference ID:</strong> ${messageId}
          </div>
          
          <p>If it's urgent, feel free to send another message.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #666; font-size: 14px;">
            Best,<br>
            <strong style="color: #68191E;">The Himspired Team</strong>
          </p>
        </div>
      </div>
    `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("Confirmation sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Email send failed:", error);
    throw new Error("Failed to send confirmation email");
  }
};

export const sendContactReply = async (
  email: string,
  name: string,
  reply: string,
  originalId: string
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Re: Your Message - ${originalId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #68191E;">HIMSPIRED</h1>
        
        <div style="background: #f8f8f8; padding: 20px; border-radius: 8px;">
          <h2 style="color: #68191E;">Response to Your Message</h2>
          
          <p>Hi ${name},</p>
          
          <div style="background: #fff; padding: 15px; margin: 15px 0; border-radius: 4px;">
            <p style="white-space: pre-wrap;">${reply}</p>
          </div>
          
          <div style="background: #e8f5e8; padding: 10px; margin: 15px 0; border-radius: 4px;">
            <small style="color: #2e7d32;"><strong>Reference:</strong> ${originalId}</small>
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
  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("Reply sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Reply send failed:", error);
    // TODO: Add retry logic for failed sends
    throw new Error("Failed to send reply email");
  }
};
