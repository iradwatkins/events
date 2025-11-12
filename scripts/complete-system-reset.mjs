import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function completeSystemReset() {
  console.log("🔄 Starting Complete System Reset");
  console.log("⚠️  This will remove ALL events, tickets, staff, and orders");
  console.log("✅ Products will be preserved\n");
  console.log("=".repeat(70) + "\n");

  try {
    // Call the reset mutation
    console.log("🧹 Calling system reset...\n");

    const result = await client.mutation(api.admin.resetData.resetAllDataExceptProducts);

    console.log("✅ System reset completed successfully!\n");
    console.log("=".repeat(70));
    console.log("RESET SUMMARY");
    console.log("=".repeat(70));
    console.log(result.message);
    console.log("\n📊 Details:");
    console.log(`   Events deleted: ${result.eventsDeleted}`);
    console.log(`   Tickets deleted: ${result.ticketsDeleted}`);
    console.log(`   Staff deleted: ${result.staffDeleted}`);
    console.log(`   Orders deleted: ${result.ordersDeleted}`);
    console.log(`   Bundles deleted: ${result.bundlesDeleted}`);
    console.log(`   Seating charts deleted: ${result.seatingChartsDeleted}`);
    console.log(`   Flyers deleted: ${result.flyersDeleted}`);
    console.log("\n✅ Products preserved: All products remain intact");
    console.log("\n✨ System is now clean and ready for fresh data!\n");

  } catch (error) {
    console.error("\n❌ Reset failed:", error.message);
    console.log("\n⚠️  System reset incomplete. Please check the error above.\n");
  }
}

completeSystemReset().catch(console.error);
