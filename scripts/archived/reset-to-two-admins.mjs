#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { internal } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const CONVEX_DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;

if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL environment variable is required");
  process.exit(1);
}

if (!CONVEX_DEPLOY_KEY) {
  console.error("❌ CONVEX_DEPLOY_KEY environment variable is required");
  console.error("Get it from: https://dashboard.convex.dev/deployment/settings/fearless-dragon-613");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);
client.setAdminAuth(CONVEX_DEPLOY_KEY);

const ADMINS_TO_KEEP = [
  "iradwatkins@gmail.com",
  "bobbygwatkins@gmail.com"
];

async function resetToTwoAdmins() {
  console.log("🔍 Starting user cleanup...\n");
  console.log("⚠️  WARNING: This will permanently delete all users except:");
  console.log("   • iradwatkins@gmail.com");
  console.log("   • bobbygwatkins@gmail.com");
  console.log("\n" + "=".repeat(80) + "\n");

  try {
    // Execute bulk deletion using internal mutation
    console.log("🗑️  Executing bulk deletion...\n");

    const result = await client.mutation(internal.users.admin.bulkDeleteUsers, {
      emailsToKeep: ADMINS_TO_KEEP
    });

    console.log("\n✅ CLEANUP COMPLETE!");
    console.log(`   • Total users before: ${result.totalUsers}`);
    console.log(`   • Users deleted: ${result.deletedCount}`);
    console.log(`   • Users remaining: ${result.remainingCount}`);
    console.log(`\n👥 Both admin accounts have been set to 'admin' role.`);
    console.log("\n" + "=".repeat(80));
    console.log("✅ Database reset successful!");
    console.log("=".repeat(80) + "\n");

  } catch (error) {
    console.error("\n❌ Error during cleanup:", error);
    if (error.message && error.message.includes("CONVEX_DEPLOY_KEY")) {
      console.error("\n💡 TIP: Get your deploy key from:");
      console.error("   https://dashboard.convex.dev/deployment/settings/fearless-dragon-613");
    }
    process.exit(1);
  }
}

// Run the script
resetToTwoAdmins()
  .then(() => {
    console.log("\n✨ Done!\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
