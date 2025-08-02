#!/usr/bin/env node

/**
 * Complete initialization script for the Himspired platform
 * This script sets up all necessary database structures and initial data
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createIndexes } from "./create-indexes";
import { stateDeliveryService } from "@/lib/state-delivery";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

// Check for required environment variables
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  console.error("Please check your .env.local file");
  process.exit(1);
}

const initializeAll = async () => {
  console.log("🚀 Starting complete initialization...");

  try {
        // Step 1: Initialize delivery fees (this will create the collection)
    console.log("\n💰 Step 1: Initializing delivery fees...");
    await stateDeliveryService.initializeDefaultFees();
    
    console.log("✅ Delivery fees initialized successfully");
    
    // Step 2: Create database indexes
    console.log("\n📊 Step 2: Creating database indexes...");
    const indexResult = await createIndexes();
    
    if (!indexResult.success) {
      console.error("❌ Database index creation failed:", indexResult.error);
      process.exit(1);
    }
    
    console.log("✅ Database indexes created successfully");

    console.log("✅ Delivery fees initialized successfully");

    console.log("\n🎉 Complete initialization finished successfully!");
    console.log("📊 All Nigerian states now have default delivery fees");
    console.log(
      "💡 You can customize fees through the admin interface at /admin/delivery-fees"
    );
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initializeAll()
    .then(() => {
      console.log("\n✨ Ready to rock!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to complete initialization:", error);
      process.exit(1);
    });
}

export { initializeAll };
