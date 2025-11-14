#!/usr/bin/env node

/**
 * Verify Test Events Data
 * Check that all events were created correctly with categories and images
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🔍 Verifying Test Events Data\n");
console.log(`📡 Convex URL: ${CONVEX_URL}\n`);

async function verifyEvents() {
  try {
    // Get all events
    const events = await client.query(api.events.queries.getOrganizerEvents);

    console.log(`Found ${events.length} total events\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Group events by type
    const saveTheDateEvents = events.filter(e => e.eventType === "SAVE_THE_DATE");
    const freeEvents = events.filter(e => e.eventType === "FREE_EVENT");

    console.log(`📌 Save the Date Events: ${saveTheDateEvents.length}`);
    console.log(`🎉 Free Events: ${freeEvents.length}\n`);

    // Check each event for completeness
    let missingCategories = 0;
    let missingImages = 0;
    let completeEvents = 0;

    console.log("Event Details:\n");

    events.forEach((event, index) => {
      const hasCategories = event.categories && event.categories.length > 0;
      const hasImage = event.imageUrl || (event.images && event.images.length > 0);

      if (!hasCategories) missingCategories++;
      if (!hasImage) missingImages++;
      if (hasCategories && hasImage) completeEvents++;

      const eventTypeIcon = event.eventType === "SAVE_THE_DATE" ? "📌" : "🎉";
      const imageIcon = hasImage ? "✓" : "✗";
      const categoryIcon = hasCategories ? "✓" : "✗";

      console.log(`${index + 1}. ${eventTypeIcon} ${event.name}`);
      console.log(`   Type: ${event.eventType}`);
      console.log(`   Image: ${imageIcon} ${hasImage ? (event.imageUrl ? "(External URL)" : "(Uploaded)") : "MISSING"}`);
      console.log(`   Categories: ${categoryIcon} ${hasCategories ? event.categories.join(", ") : "MISSING"}`);

      if (event.location) {
        const city = typeof event.location === 'string' ? event.location : `${event.location.city}, ${event.location.state}`;
        console.log(`   Location: ${city}`);
      }

      console.log(`   Status: ${event.status || "UNKNOWN"}`);
      console.log("");
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("📊 Summary:\n");
    console.log(`   ✓ Complete Events: ${completeEvents}`);
    console.log(`   ✗ Missing Categories: ${missingCategories}`);
    console.log(`   ✗ Missing Images: ${missingImages}`);

    if (completeEvents === events.length) {
      console.log("\n✅ All events are complete with categories and images!");
    } else {
      console.log("\n⚠️  Some events are missing data. Review above for details.");
    }

    // Check for unique categories
    const allCategories = new Set();
    events.forEach(event => {
      if (event.categories) {
        event.categories.forEach(cat => allCategories.add(cat));
      }
    });

    console.log(`\n🏷️  Unique Categories Found: ${allCategories.size}`);
    console.log(`   ${Array.from(allCategories).sort().join(", ")}`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    throw error;
  }
}

verifyEvents()
  .then(() => {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
