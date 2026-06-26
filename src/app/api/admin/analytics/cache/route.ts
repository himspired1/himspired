import { NextRequest, NextResponse } from "next/server";
import { AdminAuth } from "@/lib/admin-auth";
import { cacheService } from "@/lib/cache-service";

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await AdminAuth.verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // Optional: clear specific type

    if (type) {
      await cacheService.clearAnalyticsCache(type);
    } else {
      await cacheService.clearAnalyticsCache();
    }

    return NextResponse.json({
      success: true,
      message: type
        ? `Cleared ${type} analytics cache`
        : "Cleared all analytics cache",
    });
  } catch (error) {
    console.error("Cache clear error:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}
