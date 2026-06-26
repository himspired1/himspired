import { NextResponse } from "next/server";
import { cacheService } from "@/lib/cache-service";
import { checkRedisHealth } from "@/lib/redis";

export async function GET() {
  try {
    const cacheStats = await cacheService.getCacheStats();
    const redisHealth = await checkRedisHealth();

    return NextResponse.json({
      success: true,
      cache: {
        available: cacheStats.available,
        type: cacheStats.type,
        redisHealth: redisHealth,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cache health check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check cache health",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
