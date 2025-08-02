import { NextRequest, NextResponse } from "next/server";
import { getClientWithRetry } from "@/lib/mongodb";
import { AdminAuth } from "@/lib/admin-auth";
import { cacheService } from "@/lib/cache-service";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await AdminAuth.verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get("range") || "30";

    // Validate range parameter
    const range = parseInt(rangeParam);
    if (isNaN(range) || range <= 0 || range > 365) {
      return NextResponse.json(
        {
          error:
            "Invalid range parameter. Must be a positive integer between 1 and 365.",
          validRange: "1-365 days",
        },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedData = await cacheService.getAnalyticsCache(
      "orders",
      range.toString()
    );
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const end = new Date();
    const start = new Date();
    const days = range;
    start.setDate(start.getDate() - days);

    const client = await getClientWithRetry();
    const db = client.db("himspired");
    const ordersCollection = db.collection("orders");

    // Get total orders count
    const totalOrders = await ordersCollection.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    // Get pending orders count
    const pendingOrders = await ordersCollection.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: "payment_pending",
    });

    // Get completed orders count
    const completedOrders = await ordersCollection.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: { $in: ["shipped", "complete"] },
    });

    // Orders by state
    const ordersByStatePipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$customerInfo.state",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ];

    const ordersByState = await ordersCollection
      .aggregate(ordersByStatePipeline)
      .toArray();

    // Orders by status
    const ordersByStatus = await ordersCollection
      .aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ])
      .toArray();

    // Orders timeline
    const ordersTimelinePipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const ordersTimeline = await ordersCollection
      .aggregate(ordersTimelinePipeline)
      .toArray();

    // Fill missing dates with zero values
    const fillMissingDates = (data: { _id: string; count: number }[]) => {
      const result = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const existingData = data.find((item) => item._id === dateStr);

        result.push({
          date: dateStr,
          count: existingData ? existingData.count : 0,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    };

    const result = {
      total: totalOrders,
      pending: pendingOrders,
      completed: completedOrders,
      byState: ordersByState
        .filter((item) => item._id && item._id !== null)
        .map((item) => ({
          state: item._id,
          count: item.count,
        })),
      byStatus: ordersByStatus.map((item) => ({
        status: item._id,
        count: item.count,
      })),
      timeline: fillMissingDates(
        ordersTimeline as { _id: string; count: number }[]
      ),
    };

    // Cache the result
    await cacheService.setAnalyticsCache("orders", range.toString(), result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Orders analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders data" },
      { status: 500 }
    );
  }
}
