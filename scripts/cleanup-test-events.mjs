import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function cleanupTestEvents() {
  console.log("🧹 Starting Test Event Cleanup\n");

  // Get Ira's user ID
  const ira = await client.query(api.users.queries.getUserByEmail, {
    email: "iradwatkins@gmail.com"
  });

  if (!ira) {
    console.error("❌ User not found");
    return;
  }

  console.log(`✅ Found organizer: ${ira.name}\n`);

  // Get all events
  const allEvents = await client.query(api.events.queries.getOrganizerEvents);

  console.log(`📊 Found ${allEvents.length} total events\n`);

  // Filter test events (created during testing)
  const testEvents = allEvents.filter(event =>
    event.name.includes("Test Event") ||
    event.name.includes("ERROR TEST") ||
    event.name.includes("Copy Target") ||
    event.name.includes("Source Event") ||
    event.name.includes("Clean Target") ||
    event.name.includes("Empty Event")
  );

  if (testEvents.length === 0) {
    console.log("✅ No test events found to cleanup\n");
    return;
  }

  console.log(`🗑️  Found ${testEvents.length} test events to remove:\n`);

  for (const event of testEvents) {
    console.log(`   - ${event.name} (${event._id})`);
  }

  console.log("\n🔄 Deleting test events in bulk...\n");

  const eventIds = testEvents.map(e => e._id);

  try {
    await client.mutation(api.events.mutations.bulkDeleteEvents, {
      eventIds: eventIds
    });
    console.log(`✅ Successfully deleted ${testEvents.length} events`);

    console.log("\n" + "=".repeat(60));
    console.log("CLEANUP SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully deleted: ${testEvents.length} events`);
    console.log(`📊 Remaining events: ${allEvents.length - testEvents.length}`);
    console.log("\n✨ Cleanup complete!\n");
  } catch (error) {
    console.error(`\n❌ Bulk delete failed: ${error.message}`);
    console.log("\n⚠️  Cleanup failed. Events not deleted.\n");
  }
}

cleanupTestEvents().catch(console.error);
