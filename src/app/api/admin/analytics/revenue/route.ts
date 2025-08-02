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
    const range = searchParams.get("range") || "30";

    // Check cache first
    const cachedData = await cacheService.getAnalyticsCache("revenue", range);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const end = new Date();
    const start = new Date();
    const days = parseInt(range);
    start.setDate(start.getDate() - days);

    const client = await getClientWithRetry();
    const db = client.db("himspired");
    const ordersCollection = db.collection("orders");

    // Aggregate revenue data - only include orders with confirmed payments
    const revenuePipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ["payment_confirmed", "shipped", "complete"] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          dailyRevenue: { $sum: "$total" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const dailyRevenue = await ordersCollection
      .aggregate(revenuePipeline)
      .toArray();

    // Calculate total revenue and growth
    const totalRevenue = dailyRevenue.reduce(
      (sum, day) => sum + day.dailyRevenue,
      0
    );

    // Calculate growth compared to previous period
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - days);

    const previousRevenuePipeline = [
      {
        $match: {
          createdAt: { $gte: previousStart, $lt: start },
          status: { $in: ["payment_confirmed", "shipped", "complete"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ];

    const previousRevenueResult = await ordersCollection
      .aggregate(previousRevenuePipeline)
      .toArray();

    const previousRevenue =
      previousRevenueResult.length > 0 ? previousRevenueResult[0].total : 0;
    const growth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    // Generate weekly and monthly data
    const weeklyPipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ["payment_confirmed", "shipped", "complete"] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-W%U", date: "$createdAt" },
          },
          weeklyRevenue: { $sum: "$total" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const monthlyPipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ["payment_confirmed", "shipped", "complete"] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$createdAt" },
          },
          monthlyRevenue: { $sum: "$total" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const weeklyRevenue = await ordersCollection
      .aggregate(weeklyPipeline)
      .toArray();
    const monthlyRevenue = await ordersCollection
      .aggregate(monthlyPipeline)
      .toArray();

    // Fill missing dates with zero values
    interface RevenueData {
      _id: string;
      [key: string]: number | string;
    }

    const fillMissingDates = (
      data: RevenueData[],
      dateField: string,
      valueField: string
    ) => {
      const result = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const existingData = data.find((item) => item._id === dateStr);

        result.push({
          date: dateStr,
          amount: existingData ? (existingData[valueField] as number) : 0,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    };

    const dailyData = fillMissingDates(
      dailyRevenue as RevenueData[],
      "_id",
      "dailyRevenue"
    );
    const weeklyData = weeklyRevenue.map((item) => ({
      week: item._id,
      amount: item.weeklyRevenue,
    }));
    const monthlyData = monthlyRevenue.map((item) => ({
      month: item._id,
      amount: item.monthlyRevenue,
    }));

    const result = {
      total: totalRevenue,
      growth: Math.round(growth * 100) / 100,
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
    };

    // Cache the result
    await cacheService.setAnalyticsCache("revenue", range, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Revenue analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}
