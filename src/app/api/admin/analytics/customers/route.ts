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
      "customers",
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

    // Get total unique customers using aggregation instead of distinct
    const totalCustomersPipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$customerInfo.email",
        },
      },
      {
        $count: "total",
      },
    ];

    const totalCustomersResult = await ordersCollection
      .aggregate(totalCustomersPipeline)
      .toArray();

    const totalCustomers =
      totalCustomersResult.length > 0 ? totalCustomersResult[0].total : 0;

    // Get new customers (unique emails in this period that haven't ordered before)
    const newCustomersPipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$customerInfo.email",
          firstOrder: { $min: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "orders",
          let: { email: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$customerInfo.email", "$$email"] },
                    { $lt: ["$createdAt", start] },
                  ],
                },
              },
            },
          ],
          as: "previousOrders",
        },
      },
      {
        $match: {
          previousOrders: { $size: 0 },
        },
      },
      {
        $count: "count",
      },
    ];

    const newCustomersResult = await ordersCollection
      .aggregate(newCustomersPipeline)
      .toArray();
    const newCustomers =
      newCustomersResult.length > 0 ? newCustomersResult[0].count : 0;

    // Get returning customers (emails that ordered before this period and also in this period)
    const returningCustomersPipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$customerInfo.email",
          currentPeriodOrders: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "orders",
          let: { email: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$customerInfo.email", "$$email"] },
                    { $lt: ["$createdAt", start] },
                  ],
                },
              },
            },
          ],
          as: "previousOrders",
        },
      },
      {
        $match: {
          previousOrders: { $ne: [] },
        },
      },
      {
        $count: "count",
      },
    ];

    const returningCustomersResult = await ordersCollection
      .aggregate(returningCustomersPipeline)
      .toArray();
    const returningCustomers =
      returningCustomersResult.length > 0
        ? returningCustomersResult[0].count
        : 0;

    // Customers by state
    const customersByStatePipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            state: "$customerInfo.state",
            email: "$customerInfo.email",
          },
        },
      },
      {
        $group: {
          _id: "$_id.state",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ];

    const customersByState = await ordersCollection
      .aggregate(customersByStatePipeline)
      .toArray();

    const result = {
      total: totalCustomers,
      new: newCustomers,
      returning: returningCustomers,
      byState: customersByState.map((item) => ({
        state: item._id,
        count: item.count,
      })),
    };

    // Cache the result
    await cacheService.setAnalyticsCache("customers", range.toString(), result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Customers analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers data" },
      { status: 500 }
    );
  }
}
