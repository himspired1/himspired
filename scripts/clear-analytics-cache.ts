#!/usr/bin/env node

/**
 * Script to clear analytics cache
 * Run with: npm run clear-cache
 */

import { cacheService } from "../src/lib/cache-service";

async function clearAnalyticsCache() {
  try {
    console.log("🗑️  Clearing analytics cache...");

    // Clear all analytics cache
    await cacheService.clearAnalyticsCache();

    console.log("✅ Analytics cache cleared successfully!");
    console.log("📊 Dashboard should now show fresh data from database");

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to clear analytics cache:", error);
    process.exit(1);
  }
}

clearAnalyticsCache();
