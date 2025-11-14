/**
 * Add image to Holiday Season Step Fest 2025 event
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function main() {
  console.log("🖼️  Adding image to Holiday Season Step Fest 2025...\n");

  const eventId = "jh71czqg7svp2z7xb7t0qrapk17tt650";

  // Use a dance party/stepping event image from Unsplash
  const imageUrl = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80";

  try {
    await client.mutation(api.events.mutations.updateEvent, {
      eventId,
      imageUrl
    });

    console.log("✅ Event image updated successfully!");
    console.log(`   Event ID: ${eventId}`);
    console.log(`   Image URL: ${imageUrl}`);
    console.log(`\n🌐 View event at: https://events.stepperslife.com/events/${eventId}`);
  } catch (error) {
    console.error("❌ Error updating event:", error.message);
    process.exit(1);
  }
}

main();
