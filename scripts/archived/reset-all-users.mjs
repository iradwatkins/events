import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function resetAllUsers() {
  console.log("🔥 COMPLETE USER RESET");
  console.log("=" .repeat(70));
  console.log("⚠️  WARNING: This will delete ALL users and ALL related data!");
  console.log("✅ Products will be preserved");
  console.log("=" .repeat(70) + "\n");

  try {
    console.log("🧹 Executing complete user reset...\n");

    const result = await client.mutation(api.admin.resetData.resetAllUsers);

    console.log("✅ User reset completed successfully!\n");
    console.log("=" .repeat(70));
    console.log("RESET SUMMARY");
    console.log("=" .repeat(70));
    console.log("\n📊 Deleted Counts:");
    console.log(`   Users: ${result.deletedCounts.users}`);
    console.log(`   Organizer Credits: ${result.deletedCounts.organizerCredits}`);
    console.log(`   Events: ${result.deletedCounts.events}`);
    console.log(`   Ticket Tiers: ${result.deletedCounts.ticketTiers}`);
    console.log(`   Tickets: ${result.deletedCounts.tickets}`);
    console.log(`   Orders: ${result.deletedCounts.orders}`);
    console.log(`   Product Orders: ${result.deletedCounts.productOrders}`);
    console.log(`   Cash Payments: ${result.deletedCounts.cashPayments}`);
    console.log(`   Payment Configs: ${result.deletedCounts.paymentConfigs}`);
    console.log(`   Seating Layouts: ${result.deletedCounts.seatingLayouts}`);
    console.log(`   Seat Assignments: ${result.deletedCounts.seatAssignments}`);
    console.log(`   Event Staff: ${result.deletedCounts.eventStaff}`);
    console.log(`   Staff Allocations: ${result.deletedCounts.staffAllocations}`);
    console.log(`   Bundles: ${result.deletedCounts.bundles}`);
    console.log(`   Bundle Purchases: ${result.deletedCounts.bundlePurchases}`);
    console.log(`   Discounts: ${result.deletedCounts.discounts}`);
    console.log(`   Transfers: ${result.deletedCounts.transfers}`);
    console.log(`   Flyers: ${result.deletedCounts.flyers}`);
    console.log(`   CRM Contacts: ${result.deletedCounts.crm}`);
    console.log(`   Waitlist: ${result.deletedCounts.waitlist}`);
    console.log(`   Notifications: ${result.deletedCounts.notifications}`);

    console.log("\n✅ Products preserved: All products remain intact");
    console.log("\n✨ System is now clean and ready for brand new accounts!\n");

  } catch (error) {
    console.error("\n❌ Reset failed:", error.message);
    console.log("\n⚠️  User reset incomplete. Please check the error above.\n");
  }
}

resetAllUsers().catch(console.error);
