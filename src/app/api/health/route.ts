import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/mongodb";
import { cacheService } from "@/lib/cache-service";

export const runtime = "nodejs";

export async function GET() {
  const startTime = Date.now();
  const healthChecks = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {
      database: false,
      redis: false,
      memory: {
        rss: 0,
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
      },
    },
    performance: {
      responseTime: 0,
    },
  };

  try {
    // Check database connectivity
    try {
      healthChecks.checks.database = await checkDatabaseConnection();
    } catch (error) {
      console.error("Database health check failed:", error);
      healthChecks.checks.database = false;
    }

    // Check Redis connectivity
    try {
      await cacheService.ping();
      healthChecks.checks.redis = true;
    } catch (error) {
      console.error("Redis health check failed:", error);
      healthChecks.checks.redis = false;
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    healthChecks.checks.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
    };

    // Calculate response time
    healthChecks.performance.responseTime = Date.now() - startTime;

    // Determine overall health status
    const allChecksPassed = Object.values(healthChecks.checks).every(
      (check) => check === true || (typeof check === "object" && check !== null)
    );

    const status = allChecksPassed ? 200 : 503;
    const message = allChecksPassed ? "Healthy" : "Unhealthy";

    return NextResponse.json(
      {
        status: message,
        ...healthChecks,
      },
      { status }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "Error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      { status: 500 }
    );
  }
}
