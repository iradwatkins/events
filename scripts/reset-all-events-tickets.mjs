#!/usr/bin/env node

/**
 * Reset All Events and Tickets
 *
 * This script will delete all events, tickets, orders, and related data
 * to give you a clean slate for testing RBAC.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;

if (!DEPLOY_KEY) {
  console.error("❌ ERROR: CONVEX_DEPLOY_KEY environment variable not set");
  console.error("   Set it with: export CONVEX_DEPLOY_KEY='your-key'");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);
client.setAdminAuth(DEPLOY_KEY);

async function resetAllData() {
  console.log("🔄 Starting complete reset of events and tickets...\n");
  console.log("⚠️  WARNING: This will delete ALL events, tickets, orders, and related data!");
  console.log("⚠️  This cannot be undone!\n");

  try {
    // Use the admin cleanup function
    console.log("🗑️  Calling admin cleanup function...\n");

    const result = await client.mutation(api.admin.cleanup.resetAllEventsAndTickets);

    console.log("\n✅ ============================================");
    console.log("✅ RESET COMPLETE!");
    console.log("✅ ============================================");
    console.log("\n📊 Summary:");
    console.log(`   ${JSON.stringify(result, null, 2)}`);
    console.log("\n🎯 The system is now clean and ready for fresh data.");
    console.log("🎯 All users are preserved - only events and tickets were deleted.");

  } catch (error) {
    console.error("\n❌ ERROR during reset:", error.message);

    // If the cleanup function doesn't exist, try manual deletion
    console.log("\n🔄 Attempting manual cleanup...");
    await manualCleanup();
  }
}

async function manualCleanup() {
  try {
    // Get all events using a query that doesn't require auth
    console.log("📋 Fetching all events...");

    // We'll need to create a simple query or use existing ones
    // For now, let's try to delete via mutations

    console.log("\n⚠️  Manual cleanup requires creating helper functions in Convex.");
    console.log("Please run this instead:");
    console.log("\n  npx convex run admin:cleanup:resetAllEventsAndTickets\n");

  } catch (error) {
    console.error("❌ Manual cleanup failed:", error.message);
    process.exit(1);
  }
}

// Run the reset
resetAllData().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
