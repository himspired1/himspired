#!/usr/bin/env tsx

/**
 * Test script to verify stock calculation logic
 * This script tests the scenario described in the issue:
 * - 5 items in stock
 * - User A adds 1 item to cart and proceeds to checkout
 * - System shows "4 remaining, 1 reserved by other user" for other users
 * - After payment confirmation, should show "4 in stock" instead of "Only 3 left!"
 */

import { client } from "@/sanity/client";
import clientPromise from "@/lib/mongodb";

async function testStockCalculation() {
  console.log("🧪 Testing stock calculation logic...");

  try {
    // Test with a sample product
    const productId = "clothingItem_test"; // Replace with actual product ID

    // Step 1: Get current stock
    const product = await client.fetch(
      `*[_type == "clothingItem" && _id == $productId][0]`,
      { productId }
    );

    if (!product) {
      console.log("❌ Test product not found");
      return;
    }

    console.log(`📦 Product: ${product.title}`);
    console.log(`📊 Current stock: ${product.stock}`);
    console.log(
      `🔒 Current reservations: ${product.reservations?.length || 0}`
    );

    // Step 2: Check pending orders
    const mongoClient = await clientPromise;
    const db = mongoClient.db("himspired");
    const ordersCollection = db.collection("orders");

    const pendingOrders = await ordersCollection
      .find({
        status: "payment_pending",
        "items.productId": productId,
      })
      .toArray();

    const confirmedOrders = await ordersCollection
      .find({
        status: "payment_confirmed",
        "items.productId": productId,
      })
      .toArray();

    console.log(`📋 Pending orders: ${pendingOrders.length}`);
    console.log(`✅ Confirmed orders: ${confirmedOrders.length}`);

    // Step 3: Calculate expected stock
    const reservations = product.reservations || [];
    const pendingOrderSessionIds = new Set(
      pendingOrders
        .filter((order) => order.sessionId)
        .map((order) => order.sessionId)
    );
    const confirmedOrderSessionIds = new Set(
      confirmedOrders
        .filter((order) => order.sessionId)
        .map((order) => order.sessionId)
    );

    // Calculate reservations that should be counted
    const validReservations = reservations.filter((reservation: any) => {
      const isPendingOrder = pendingOrderSessionIds.has(reservation.sessionId);
      const isConfirmedOrder = confirmedOrderSessionIds.has(
        reservation.sessionId
      );
      return !isPendingOrder && !isConfirmedOrder;
    });

    const totalReservedQuantity = validReservations.reduce(
      (sum: number, r: any) => sum + (r.quantity || 0),
      0
    );

    const availableStock = Math.max(0, product.stock - totalReservedQuantity);

    console.log(`🔍 Analysis:`);
    console.log(`   - Total reservations: ${reservations.length}`);
    console.log(`   - Valid reservations: ${validReservations.length}`);
    console.log(`   - Reserved quantity: ${totalReservedQuantity}`);
    console.log(`   - Available stock: ${availableStock}`);

    // Step 4: Test the stock API endpoint
    const baseUrl =
      process.env.BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";
    const stockResponse = await fetch(
      `${baseUrl}/api/products/stock/${productId}?clearCache=true`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (stockResponse.ok) {
      const stockData = await stockResponse.json();
      console.log(`📊 API Response:`);
      console.log(`   - Available stock: ${stockData.availableStock}`);
      console.log(`   - Reserved quantity: ${stockData.reservedQuantity}`);
      console.log(`   - Stock message: ${stockData.stockMessage}`);

      // Verify the calculation matches
      if (stockData.availableStock === availableStock) {
        console.log(`✅ Stock calculation is correct!`);
      } else {
        console.log(`❌ Stock calculation mismatch!`);
        console.log(
          `   Expected: ${availableStock}, Got: ${stockData.availableStock}`
        );
      }
    } else {
      console.log(`❌ Failed to get stock data: ${await stockResponse.text()}`);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testStockCalculation()
  .then(() => {
    console.log("🏁 Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });
