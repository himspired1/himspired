#!/usr/bin/env node

/**
 * Initialize default delivery fees for all Nigerian states
 * Run this script to set up initial delivery fee data
 */

import { config } from "dotenv";
import { resolve } from "path";
import { stateDeliveryService } from "@/lib/state-delivery";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

// Check for required environment variables
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  console.error("Please check your .env.local file");
  process.exit(1);
}

const initializeDeliveryFees = async () => {
  console.log("Initializing delivery fees for all states...");

  try {
    // Initialize default fees
    await stateDeliveryService.initializeDefaultFees();

    console.log("✅ Delivery fees initialized successfully");
    console.log("📊 All Nigerian states now have default delivery fees");
    console.log("💡 You can customize fees through the admin interface");
  } catch (error) {
    console.error("❌ Failed to initialize delivery fees:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initializeDeliveryFees()
    .then(() => {
      console.log("🎉 Delivery fee initialization completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to initialize delivery fees:", error);
      process.exit(1);
    });
}

export { initializeDeliveryFees };
