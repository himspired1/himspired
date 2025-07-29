import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const test = searchParams.get("test");

    if (test === "compare") {
      // Test to compare stock and availability endpoints
      const vneckProductId = "980ae3d1-73d5-4fb3-a33d-b14f60af33bf";

      const stockResponse = await fetch(
        `http://localhost:3000/api/products/stock/${vneckProductId}?sessionId=test`
      );
      const availabilityResponse = await fetch(
        `http://localhost:3000/api/products/availability/${vneckProductId}?sessionId=test`
      );

      const stockData = await stockResponse.json();
      const availabilityData = await availabilityResponse.json();

      return NextResponse.json({
        message: "Comparing stock and availability endpoints",
        stock: stockData,
        availability: availabilityData,
        match: stockData.availableStock === availabilityData.availableStock,
      });
    }

    if (!productId) {
      // List all products to help find the V-neck knit shirt
      const products = await client.fetch(
        `*[_type == "clothingItem"]{
          _id, title, stock, category
        }`
      );

      return NextResponse.json({
        message:
          "All products (use ?productId=ID to test specific product, or ?test=compare to compare endpoints)",
        products: products,
      });
    }

    // Get product from Sanity
    const product = await client.fetch(
      `*[_type == "clothingItem" && _id == $productId][0]{
        _id, title, stock, reservations
      }`,
      { productId }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check for pending orders
    const mongoClient = await clientPromise;
    const db = mongoClient.db("himspired");
    const ordersCollection = db.collection("orders");

    const pendingOrders = (await ordersCollection
      .find({
        status: "payment_pending",
        "items.productId": productId,
      })
      .toArray()) as unknown[];

    // Calculate pending order quantities
    const pendingOrderReservedQuantity = pendingOrders.reduce(
      (total, orderRaw) => {
        const order = orderRaw as {
          items: { productId: string; quantity: number }[];
        };
        const orderItem = order.items.find(
          (item) => item.productId === productId
        );
        return (total as number) + (orderItem ? orderItem.quantity : 0);
      },
      0
    );

    // Clean up expired reservations
    const now = new Date();

    const reservations = (product.reservations || []).filter((r: unknown) => {
      const res = r as { reservedUntil?: string };
      return res.reservedUntil && new Date(res.reservedUntil) > now;
    });

    const reservationQuantity = reservations.reduce(
      (sum: number, r: unknown) => {
        const res = r as { quantity?: number };
        return sum + (res.quantity || 0);
      },
      0
    );

    const totalReservedQuantity =
      reservationQuantity + pendingOrderReservedQuantity;
    const availableStock = Math.max(0, product.stock - totalReservedQuantity);

    return NextResponse.json({
      product: {
        _id: product._id,
        title: product.title,
        stock: product.stock,
        reservations: reservations,
        reservationQuantity: reservationQuantity,
      },
      pendingOrders: {
        count: pendingOrders.length,
        orders: pendingOrders.map((orderRaw) => {
          const order = orderRaw as {
            orderId?: string;
            items: { productId: string }[];
          };
          return {
            orderId: order.orderId,
            items: order.items.filter((item) => item.productId === productId),
          };
        }),
        totalReservedQuantity: pendingOrderReservedQuantity,
      },
      calculations: {
        totalReservedQuantity,
        availableStock,
        breakdown: {
          reservations: reservationQuantity,
          pendingOrders: pendingOrderReservedQuantity,
        },
      },
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to test stock calculation" },
      { status: 500 }
    );
  }
}
