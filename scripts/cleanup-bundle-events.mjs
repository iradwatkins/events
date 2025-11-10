import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

console.log("🧹 Cleaning Up Bundle Test Events");
console.log("===================================\n");

// List of event names to delete (from bundle test script)
const bundleEventNames = [
  // Memorial Day Weekend
  "Memorial Day Weekend - Friday Night Dance",
  "Memorial Day Weekend - Saturday Night Social",
  "Memorial Day Weekend - Sunday Brunch & Dance",

  // Labor Day Weekend
  "Labor Day Weekend - Friday Night Steppers Set",
  "Labor Day Weekend - Championship Night",
  "Labor Day Weekend - Farewell Social",

  // Juneteenth Weekend
  "Juneteenth Weekend - Friday Kickoff Party",
  "Juneteenth Weekend - Saturday Celebration Dance",
  "Juneteenth Weekend - Sunday Unity Brunch",

  // Valentine's Day
  "Valentine's Day - Beginner's Workshop",
  "Valentine's Day - Couples Social",
  "Valentine's Day - Evening Romance Dance",

  // New Year's Day
  "New Year's Day - Recovery Brunch & Light Stepping",
  "New Year's Day - Afternoon Social",
  "New Year's Day - First Dance of the Year",

  // 4th of July
  "4th of July - Independence Day Brunch",
  "4th of July - Afternoon Social",
  "4th of July - Evening Spectacular",

  // Spring Training
  "Spring Training - Opening Weekend Friday",
  "Spring Training - Opening Weekend Saturday",
  "Spring Training - Opening Weekend Sunday",
  "Spring Training - Season Finale",

  // Summer Series
  "Summer Series - Week 1: Kickoff",
  "Summer Series - Week 2: Social Night",
  "Summer Series - Week 3: Championship",
  "Summer Series - Week 4: Finale",

  // Championship Weekend
  "Championship Weekend - Friday Qualifiers",
  "Championship Weekend - Saturday Semi-Finals",
  "Championship Weekend - Sunday Finals",
  "Championship Weekend - After Party"
];

async function cleanupBundleEvents() {
  try {
    console.log(`Looking for ${bundleEventNames.length} bundle test events to delete...\n`);

    // Get all events
    const allEvents = await client.query(api.events.queries.getOrganizerEvents, {});

    console.log(`Found ${allEvents.length} total events in database`);
    console.log("");

    // Find bundle events
    const bundleEvents = allEvents.filter(event =>
      bundleEventNames.includes(event.name)
    );

    console.log(`Found ${bundleEvents.length} bundle test events to delete:`);
    bundleEvents.forEach(event => {
      console.log(`  • ${event.name} (ID: ${event._id})`);
    });
    console.log("");

    if (bundleEvents.length === 0) {
      console.log("✅ No bundle test events found. Nothing to clean up!");
      return;
    }

    // Delete events one by one
    console.log("Starting deletion...\n");
    let successCount = 0;
    let failCount = 0;

    for (const event of bundleEvents) {
      try {
        // Check if event has any sold tickets
        const stats = await client.query(api.events.queries.getEventStatistics, {
          eventId: event._id
        });

        if (stats.totalTicketsSold > 0) {
          console.log(`  ⚠️  Skipping "${event.name}" - has ${stats.totalTicketsSold} tickets sold`);
          failCount++;
          continue;
        }

        // Delete the event
        await client.mutation(api.events.mutations.deleteEvent, {
          eventId: event._id
        });

        console.log(`  ✅ Deleted: ${event.name}`);
        successCount++;
      } catch (error) {
        console.log(`  ❌ Failed to delete "${event.name}": ${error.message}`);
        failCount++;
      }
    }

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 CLEANUP SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ Successfully deleted: ${successCount} events`);
    console.log(`❌ Failed to delete: ${failCount} events`);
    console.log("");

    // Show remaining events
    const remainingEvents = await client.query(api.events.queries.getOrganizerEvents, {});
    console.log(`📋 Remaining events in database: ${remainingEvents.length}`);

    if (remainingEvents.length > 0) {
      console.log("");
      console.log("Remaining events:");
      remainingEvents.forEach(event => {
        console.log(`  • ${event.name} (ID: ${event._id})`);
      });
    }

    console.log("");
    console.log("✅ Cleanup completed!");

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  }
}

// Run the cleanup
cleanupBundleEvents()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
