import { NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";

export async function GET() {
  try {
    console.log("🧪 Testing Sanity client...");
    console.log(`Sanity token available: ${!!process.env.SANITY_API_TOKEN}`);

    // Test read operation
    const products = await client.fetch(`*[_type == "clothingItem"][0...3]{
      _id,
      title,
      stock
    }`);

    console.log(
      "✅ Read operation successful:",
      products.length,
      "products found"
    );

    return NextResponse.json({
      success: true,
      message: "Sanity client is working",
      tokenAvailable: !!process.env.SANITY_API_TOKEN,
      productsFound: products.length,
      sampleProduct: products[0] || null,
    });
  } catch (error) {
    console.error("❌ Sanity test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        tokenAvailable: !!process.env.SANITY_API_TOKEN,
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    console.log("🧪 Testing Sanity write operation...");

    // Test write operation (create a test document)
    const testDoc = await writeClient.create({
      _type: "testDocument",
      title: "Test Document",
      createdAt: new Date().toISOString(),
    });

    console.log("✅ Write operation successful:", testDoc._id);

    // Clean up - delete the test document
    await writeClient.delete(testDoc._id);
    console.log("✅ Test document cleaned up");

    return NextResponse.json({
      success: true,
      message: "Sanity write operations are working",
      testDocId: testDoc._id,
    });
  } catch (error) {
    console.error("❌ Sanity write test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        tokenAvailable: !!process.env.SANITY_API_TOKEN,
      },
      { status: 500 }
    );
  }
}
