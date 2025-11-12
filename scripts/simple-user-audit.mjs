import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function simpleAudit() {
  console.log("🔍 USER AUDIT - Checking Key Accounts\n");
  console.log("=".repeat(80));

  const testEmails = [
    "iradwatkins@gmail.com",
    "ira@irawatkins.com",
    "test@stepperslife.com",
    "marcus@example.com",
    "tanya@example.com",
    "derek@example.com",
    "sarah.scanner@example.com",
    "mike.scanner@example.com"
  ];

  console.log("\n📧 CHECKING ACCOUNTS:\n");

  for (const email of testEmails) {
    try {
      const user = await client.query(api.users.queries.getUserByEmail, {
        email: email
      });

      if (user) {
        console.log(`✅ ${email}`);
        console.log(`   Name: ${user.name || "No Name"}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   User ID: ${user._id}`);
        console.log(`   Has Password: ${user.passwordHash ? "✅ Yes" : "❌ No"}`);
        console.log("");
      } else {
        console.log(`❌ ${email} - NOT FOUND\n`);
      }
    } catch (error) {
      console.log(`❌ ${email} - ERROR: ${error.message}\n`);
    }
  }

  // Check event ownership
  console.log("=".repeat(80));
  console.log("\n🎫 TEST EVENT CHECK:\n");

  try {
    const EVENT_ID = "jh72wsebqa27cb8zzqw2bqvxan7v639n";
    const event = await client.query(api.events.queries.getEventById, {
      eventId: EVENT_ID
    });

    if (event) {
      console.log(`Event: ${event.name}`);
      console.log(`Event ID: ${event._id}`);
      console.log(`Status: ${event.status}`);
      console.log(`Organizer ID: ${event.organizerId}`);

      // Get organizer details
      try {
        const organizer = await client.query(api.users.queries.getUserByEmail, {
          email: "ira@irawatkins.com"
        });

        if (organizer) {
          console.log(`\nEvent Organizer:`);
          console.log(`   Name: ${organizer.name}`);
          console.log(`   Email: ${organizer.email}`);
          console.log(`   Role: ${organizer.role}`);
          console.log(`   Matches Event Owner: ${organizer._id === event.organizerId ? "✅ Yes" : "❌ No"}`);
        }
      } catch (err) {
        console.log(`❌ Could not fetch organizer: ${err.message}`);
      }
    }
  } catch (error) {
    console.log(`❌ Error fetching event: ${error.message}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n💡 SUMMARY:\n");
  console.log("The system has multiple test accounts created during setup.");
  console.log("We need to consolidate and ensure ONE account can access everything.");
}

simpleAudit()
  .then(() => {
    console.log("\n✅ Audit completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Audit failed:", error);
    process.exit(1);
  });
