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
      "delivery",
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

    // Get delivery fees by state from orders
    const deliveryFeesPipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ["payment_confirmed", "shipped", "complete"] },
        },
      },
      {
        $addFields: {
          itemsTotal: {
            $sum: {
              $map: {
                input: "$items",
                as: "item",
                in: { $multiply: ["$$item.price", "$$item.quantity"] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          deliveryFee: { $subtract: ["$total", "$itemsTotal"] },
        },
      },
      {
        $group: {
          _id: "$customerInfo.state",
          fees: { $sum: "$deliveryFee" },
        },
      },
      {
        $sort: { fees: -1 },
      },
    ];

    const deliveryFeesByStateFromOrders = await ordersCollection
      .aggregate(deliveryFeesPipeline)
      .toArray();

    // Calculate total delivery fees from orders - only confirmed payments
    const totalDeliveryFees = await ordersCollection
      .aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: { $in: ["payment_confirmed", "shipped", "complete"] },
          },
        },
        {
          $addFields: {
            itemsTotal: {
              $sum: {
                $map: {
                  input: "$items",
                  as: "item",
                  in: { $multiply: ["$$item.price", "$$item.quantity"] },
                },
              },
            },
          },
        },
        {
          $addFields: {
            deliveryFee: { $subtract: ["$total", "$itemsTotal"] },
          },
        },
        {
          $group: {
            _id: null,
            totalFees: { $sum: "$deliveryFee" },
          },
        },
      ])
      .toArray();

    const totalFees =
      totalDeliveryFees.length > 0 ? totalDeliveryFees[0].totalFees : 0;

    // Get delivery performance by state (estimated delivery times)
    const deliveryPerformancePipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ["shipped", "complete"] },
          deliveryTime: { $ne: null }, // Exclude null delivery times
        },
      },
      {
        $group: {
          _id: "$customerInfo.state",
          avgDeliveryTime: { $avg: "$deliveryTime" }, // No default value needed
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { avgDeliveryTime: 1 },
      },
    ];

    const deliveryPerformance = await ordersCollection
      .aggregate(deliveryPerformancePipeline)
      .toArray();

    // Get count of orders without delivery times for tracking
    const ordersWithoutDeliveryTime = await ordersCollection
      .aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: { $in: ["shipped", "complete"] },
            deliveryTime: null,
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
      ])
      .toArray();

    const result = {
      totalFees: totalFees,
      byState: deliveryFeesByStateFromOrders
        .filter((item) => item._id && item._id !== null)
        .map((item) => ({
          state: item._id,
          fees: item.fees,
        })),
      performance: deliveryPerformance
        .filter((item) => item._id && item._id !== null)
        .map((item) => ({
          state: item._id,
          avgTime: Math.round(item.avgDeliveryTime * 10) / 10,
        })),
      ordersWithoutDeliveryTime: ordersWithoutDeliveryTime
        .filter((item) => item._id && item._id !== null)
        .map((item) => ({
          state: item._id,
          count: item.count,
        })),
    };

    // Cache the result
    await cacheService.setAnalyticsCache("delivery", range.toString(), result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Delivery analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery data" },
      { status: 500 }
    );
  }
}
