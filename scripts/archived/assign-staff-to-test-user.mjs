import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

const TEST_EVENT_ID = "jh75kydzxb2xb1jj2rwnq1q8f97tvqfa";

async function main() {
  try {
    console.log("Finding test user...");

    // First, get the test event
    const event = await client.query(api.events.queries.getEventById, {
      eventId: TEST_EVENT_ID,
    });

    console.log("Event found:", event.name);
    console.log("Event ID:", event._id);

    // Create a staff position for the test user using the addStaffMember mutation
    console.log("\nCreating staff position for test user (iradwatkins@gmail.com)...");

    const result = await client.mutation(api.staff.mutations.addStaffMember, {
      eventId: event._id,
      name: "Ira D Watkins (Test User)",
      email: "iradwatkins@gmail.com",
      phone: "+1234567999",
      role: "TEAM_MEMBERS", // Updated to use new role system
      allocatedTickets: 500,
      commissionType: "FIXED",
      commissionValue: 300, // $3.00
      canScan: true,
    });

    console.log("✅ Staff position created successfully!");
    console.log("Staff ID:", result.staffId);
    console.log("Referral Code:", result.referralCode);

    // Update permissions to allow assigning sub-sellers
    console.log("\nUpdating permissions...");
    await client.mutation(api.staff.mutations.updateStaffPermissions, {
      staffId: result.staffId,
      canAssignSubSellers: true,
    });
    console.log("✅ Permissions updated!");

    // Verify by querying the dashboard
    console.log("\nVerifying dashboard query...");
    const dashboard = await client.query(api.staff.queries.getStaffDashboard, {});

    console.log("Dashboard data:", JSON.stringify(dashboard, null, 2));

    if (dashboard && dashboard.length > 0) {
      console.log("\n✅ SUCCESS! Dashboard now shows:", dashboard.length, "position(s)");
      dashboard.forEach((pos, i) => {
        console.log(`\nPosition ${i + 1}:`);
        console.log(`  Event: ${pos.event?.name}`);
        console.log(`  Role: ${pos.role}`);
        console.log(`  Allocated: ${pos.allocatedTickets}`);
        console.log(`  Sold: ${pos.ticketsSold}`);
        console.log(`  Remaining: ${pos.ticketsRemaining}`);
        console.log(`  Commission Earned: $${(pos.commissionEarned / 100).toFixed(2)}`);
        console.log(`  Referral Code: ${pos.referralCode}`);
      });
    } else {
      console.log("\n⚠️ Dashboard still empty");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  }

  process.exit(0);
}

main();
