import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function updateAdminRole() {
  console.log("🔧 Updating admin account to organizer role...\n");

  try {
    // Get the admin user
    const user = await client.query(api.users.queries.getUserByEmail, {
      email: "iradwatkins@gmail.com"
    });

    console.log("Current user:");
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Current Role: ${user.role}`);

    // Update to organizer
    await client.mutation(api.users.mutations.updateUserRole, {
      userId: user._id,
      role: "organizer"
    });

    console.log("\n✅ Role updated to: organizer");
    console.log("\nYou can now access:");
    console.log("  - Admin Panel: https://events.stepperslife.com/admin/events");
    console.log("  - Organizer Dashboard: https://events.stepperslife.com/organizer/events");
    console.log("\nNote: Organizer role includes admin permissions in this system.");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

updateAdminRole()
  .then(() => {
    console.log("\n✅ Update completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Update failed:", error);
    process.exit(1);
  });
