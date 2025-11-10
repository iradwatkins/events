import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

try {
  console.log("Testing getStaffDashboard query...");
  const result = await client.query(api.staff.queries.getStaffDashboard, {});
  console.log("Result:", JSON.stringify(result, null, 2));

  if (result && result.length > 0) {
    console.log("\n✅ Query returned data!");
    console.log("Found " + result.length + " staff positions");
    result.forEach((pos, i) => {
      console.log("\nPosition " + (i + 1) + ":");
      console.log("  Event: " + (pos.event?.name || 'N/A'));
      console.log("  Allocated: " + pos.allocatedTickets);
      console.log("  Sold: " + pos.ticketsSold);
      console.log("  Remaining: " + pos.ticketsRemaining);
      console.log("  Hierarchy Level: " + pos.hierarchyLevel);
      console.log("  Can Assign Sub-Sellers: " + pos.canAssignSubSellers);
    });
  } else {
    console.log("\n⚠️ Query returned empty array");
  }
} catch (error) {
  console.error("❌ Error:", error.message);
}

process.exit(0);
