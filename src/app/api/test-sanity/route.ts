import { NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";
import { TestDocument } from "@/types/testDocument";

/**
 * Sanity Test Endpoint
 *
 * This endpoint tests Sanity read and write operations.
 *
 * Write Test:
 * - Creates a testDocument with title and createdAt fields
 * - Schema defined in src/schemas/testDocument.ts
 * - TypeScript interface in src/types/testDocument.ts
 * - Automatically cleans up test documents after creation
 *
 * Read Test:
 * - Fetches first 3 clothingItem documents
 * - Verifies Sanity client connectivity
 */

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
    const testDoc = await writeClient.create<TestDocument>({
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
