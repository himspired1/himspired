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
      "revenue",
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

    type IntervalType = "daily" | "weekly" | "monthly";

    const fillMissingIntervals = (
      data: RevenueData[],
      dateField: string,
      valueField: string,
      interval: IntervalType
    ) => {
      const result = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        let dateStr: string;
        let existingData: RevenueData | undefined;

        switch (interval) {
          case "daily":
            dateStr = currentDate.toISOString().split("T")[0];
            existingData = data.find((item) => item._id === dateStr);
            result.push({
              date: dateStr,
              amount: existingData ? (existingData[valueField] as number) : 0,
            });
            currentDate.setDate(currentDate.getDate() + 1);
            break;

          case "weekly":
            // Get week number in ISO format (YYYY-Www)
            const year = currentDate.getFullYear();
            const week = getISOWeek(currentDate);
            dateStr = `${year}-W${week.toString().padStart(2, "0")}`;
            existingData = data.find((item) => item._id === dateStr);
            result.push({
              week: dateStr,
              amount: existingData ? (existingData[valueField] as number) : 0,
            });
            currentDate.setDate(currentDate.getDate() + 7);
            break;

          case "monthly":
            // Get month in YYYY-MM format
            const month = currentDate.getMonth() + 1;
            dateStr = `${currentDate.getFullYear()}-${month.toString().padStart(2, "0")}`;
            existingData = data.find((item) => item._id === dateStr);
            result.push({
              month: dateStr,
              amount: existingData ? (existingData[valueField] as number) : 0,
            });
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      return result;
    };

    // Helper function to get ISO week number
    const getISOWeek = (date: Date): number => {
      const d = new Date(date.getTime());
      d.setHours(0, 0, 0, 0);
      // Thursday in current week decides the year
      d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
      // January 4 is always in week 1
      const week1 = new Date(d.getFullYear(), 0, 4);
      // Adjust to Thursday in week 1 and count number of weeks from date to week1
      return (
        1 +
        Math.round(
          ((d.getTime() - week1.getTime()) / 86400000 -
            3 +
            ((week1.getDay() + 6) % 7)) /
            7
        )
      );
    };

    const dailyData = fillMissingIntervals(
      dailyRevenue as RevenueData[],
      "_id",
      "dailyRevenue",
      "daily"
    );
    const weeklyData = fillMissingIntervals(
      weeklyRevenue as RevenueData[],
      "_id",
      "weeklyRevenue",
      "weekly"
    );
    const monthlyData = fillMissingIntervals(
      monthlyRevenue as RevenueData[],
      "_id",
      "monthlyRevenue",
      "monthly"
    );

    const result = {
      total: totalRevenue,
      growth: Math.round(growth * 100) / 100,
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
    };

    // Cache the result
    await cacheService.setAnalyticsCache("revenue", range.toString(), result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Revenue analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}
