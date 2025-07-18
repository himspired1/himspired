import { NextResponse } from "next/server";
import logger from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    logger.info("Health check requested");

    // Basic health check - you can add more checks here
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    };

    logger.info("Health check completed successfully", { healthStatus });

    return NextResponse.json(healthStatus);
  } catch (error) {
    logger.error("Health check failed", { error });

    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
