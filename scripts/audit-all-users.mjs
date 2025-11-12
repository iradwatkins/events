import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function auditAllUsers() {
  console.log("🔍 AUDITING ALL USERS IN SYSTEM\n");
  console.log("=".repeat(80));

  try {
    // Get all users (admin query)
    const allUsers = await client.query(api.adminPanel.queries.getAllUsers, {
      limit: 100
    });

    console.log(`\nTotal Users Found: ${allUsers.length}\n`);

    // Categorize by role
    const admins = allUsers.filter(u => u.role === "admin");
    const organizers = allUsers.filter(u => u.role === "organizer");
    const regularUsers = allUsers.filter(u => u.role === "user");

    console.log("👤 USER BREAKDOWN:");
    console.log(`   Admins: ${admins.length}`);
    console.log(`   Organizers: ${organizers.length}`);
    console.log(`   Regular Users: ${regularUsers.length}`);

    console.log("\n" + "=".repeat(80));
    console.log("🔑 ADMIN ACCOUNTS:");
    console.log("=".repeat(80));
    admins.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name || "No Name"}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Has Password: ${user.passwordHash ? "✅ Yes" : "❌ No"}`);
      console.log(`   Events Created: ${user.eventCount || 0}`);
      console.log(`   Orders: ${user.orderCount || 0}`);
      console.log(`   Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : "Unknown"}`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("🎯 ORGANIZER ACCOUNTS:");
    console.log("=".repeat(80));
    organizers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name || "No Name"}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Has Password: ${user.passwordHash ? "✅ Yes" : "❌ No"}`);
      console.log(`   Events Created: ${user.eventCount || 0}`);
      console.log(`   Orders: ${user.orderCount || 0}`);
      console.log(`   Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : "Unknown"}`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("📊 REGULAR USERS (showing first 10):");
    console.log("=".repeat(80));
    regularUsers.slice(0, 10).forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name || "No Name"}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Has Password: ${user.passwordHash ? "✅ Yes" : "❌ No"}`);
      console.log(`   Orders: ${user.orderCount || 0}`);
    });

    if (regularUsers.length > 10) {
      console.log(`\n... and ${regularUsers.length - 10} more regular users`);
    }

    // Find the test event
    console.log("\n" + "=".repeat(80));
    console.log("🎫 TEST EVENT OWNERSHIP:");
    console.log("=".repeat(80));

    const EVENT_ID = "jh72wsebqa27cb8zzqw2bqvxan7v639n";
    const event = await client.query(api.events.queries.getEventById, {
      eventId: EVENT_ID
    });

    if (event) {
      console.log(`\nEvent: ${event.name}`);
      console.log(`Event ID: ${event._id}`);
      console.log(`Organizer ID: ${event.organizerId}`);

      const organizer = allUsers.find(u => u._id === event.organizerId);
      if (organizer) {
        console.log(`Organizer Name: ${organizer.name}`);
        console.log(`Organizer Email: ${organizer.email}`);
        console.log(`Organizer Role: ${organizer.role}`);
        console.log(`Has Password: ${organizer.passwordHash ? "✅ Yes" : "❌ No"}`);
      } else {
        console.log("❌ Organizer not found!");
      }
    }

    // Recommendations
    console.log("\n" + "=".repeat(80));
    console.log("💡 RECOMMENDATIONS:");
    console.log("=".repeat(80));

    const usersWithoutPasswords = allUsers.filter(u => !u.passwordHash && u.role !== "user");
    if (usersWithoutPasswords.length > 0) {
      console.log("\n⚠️  Users without passwords (cannot login):");
      usersWithoutPasswords.forEach(u => {
        console.log(`   - ${u.email} (${u.role})`);
      });
    }

    // Check for duplicate/confusing accounts
    const emailDomains = allUsers.map(u => u.email).filter(e => e.includes("irawatkins") || e.includes("stepperslife"));
    if (emailDomains.length > 0) {
      console.log("\n📧 Your accounts:");
      emailDomains.forEach(email => {
        const user = allUsers.find(u => u.email === email);
        console.log(`   - ${email} (${user.role}) ${user.passwordHash ? "✅ Has Password" : "❌ No Password"}`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

auditAllUsers()
  .then(() => {
    console.log("\n✅ Audit completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Audit failed:", error);
    process.exit(1);
  });
