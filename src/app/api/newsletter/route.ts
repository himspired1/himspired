export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { newsletterService } from "@/lib/newsletter";
import { rateLimiter, RATE_LIMIT_CONFIGS } from "@/lib/rate-limiter";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Rate limiting helper function using shared utility
async function checkNewsletterRateLimit(
  ip: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    return await rateLimiter.checkRateLimit(ip, RATE_LIMIT_CONFIGS.NEWSLETTER);
  } catch (error) {
    console.warn(
      "Newsletter rate limit check failed, allowing request:",
      error
    );
    // Fallback: allow request with default values
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIGS.NEWSLETTER.maxAttempts,
      resetTime: Date.now() + RATE_LIMIT_CONFIGS.NEWSLETTER.windowMs,
    };
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting logic
  const ip = getClientIp(req);

  const rateLimit = await checkNewsletterRateLimit(ip);
  if (!rateLimit.allowed) {
    const now = Date.now();
    const remainingMs = rateLimit.resetTime - now;
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));

    // Create response with proper headers
    const response = NextResponse.json(
      {
        error: "Too many newsletter subscriptions. Please try again later.",
        remainingTime: remainingMinutes,
        remainingSeconds: remainingSeconds,
        resetTime: new Date(rateLimit.resetTime).toISOString(),
      },
      { status: 429 }
    );

    // Add Retry-After header with remaining time in seconds (HTTP standard)
    response.headers.set("Retry-After", remainingSeconds.toString());

    return response;
  }

  try {
    const { email } = await req.json();

    // Validate email
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Save to database
    const subscriptionResult = await newsletterService.subscribe(email);

    if (!subscriptionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: subscriptionResult.message,
        },
        { status: 400 }
      );
    }

    // Send welcome email
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Welcome to Himspired",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #68191E; margin: 0; font-size: 24px;">HIMSPIRED</h1>
            </div>
            
            <div style="background: #f8f8f8; padding: 25px; border-radius: 8px;">
              <h2 style="color: #68191E; margin-top: 0;">Welcome to the Himspired Community</h2>
              
              <p style="color: #333; line-height: 1.6;">
                Thank you for joining our exclusive community of style enthusiasts!
              </p>
              
              <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #68191E;">
                <p style="margin: 0; color: #333;">
                  <strong>What to expect:</strong><br>
                  • Exclusive deals and early access to new arrivals<br>
                  • Style tips and fashion inspiration<br>
                  • Special member-only promotions<br>
                  • Updates on our latest collections
                </p>
              </div>

              <p style="color: #333; line-height: 1.6;">
                We're thrilled to have you as part of our journey to redefine fashion through affordable luxury. 
                Get ready to discover unique pieces that tell a story and elevate your style.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_URL || "https://himspired.com"}/shop" 
                   style="background: #68191E; color: white; padding: 12px 30px; text-decoration: none; 
                          border-radius: 25px; display: inline-block; font-weight: bold;">
                  Start Shopping
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
              
              <p style="color: #666; font-size: 14px; margin: 0;">
                Stay stylish,<br>
                <strong style="color: #68191E;">The Himspired Team</strong>
              </p>
              
              <p style="color: #999; font-size: 12px; margin-top: 20px; text-align: center;">
                Follow us on social media for daily style inspiration<br>
                <a href="#" style="color: #68191E; text-decoration: none;">Instagram</a> | 
                <a href="#" style="color: #68191E; text-decoration: none;">Twitter</a> | 
                <a href="#" style="color: #68191E; text-decoration: none;">TikTok</a>
              </p>
              
              <p style="color: #999; font-size: 11px; margin-top: 20px; text-align: center;">
                If you wish to unsubscribe from our newsletter, please contact us at ${process.env.EMAIL_USER}
              </p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log("Newsletter welcome email sent to:", email);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the subscription if email fails
    }

    return NextResponse.json({
      success: true,
      subscriberId: subscriptionResult.subscriberId,
      message: subscriptionResult.message,
    });
  } catch (error) {
    console.error("Newsletter subscription failed:", error);
    return NextResponse.json(
      { error: "Failed to subscribe to newsletter" },
      { status: 500 }
    );
  }
}
