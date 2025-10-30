#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";

// High-quality Unsplash images for different event types (verified working URLs)
const UNSPLASH_IMAGES = {
  dinner: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80", // Elegant restaurant
  gala: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80", // Gala ballroom
  conference: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80", // Conference
  workshop: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80", // Workshop
  dance: "https://images.unsplash.com/photo-1574602326513-09c7e1f6ead7?auto=format&fit=crop&w=800&q=80", // Dance floor
  stepping: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80", // People dancing
  vip: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80", // VIP lounge
  party: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80", // Party lights
  festival: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80", // Music festival
  concert: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80", // Concert
  default: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=800&q=80", // Event crowd
};

// Determine best image for event based on categories
function selectImageForEvent(event) {
  const name = event.name?.toLowerCase() || "";
  const categories = event.categories || [];
  const categoriesStr = categories.join(" ").toLowerCase();

  if (name.includes("dinner") || categoriesStr.includes("dinner")) {
    return UNSPLASH_IMAGES.dinner;
  }
  if (name.includes("gala") || categoriesStr.includes("gala")) {
    return UNSPLASH_IMAGES.gala;
  }
  if (name.includes("vip") || categoriesStr.includes("vip")) {
    return UNSPLASH_IMAGES.vip;
  }
  if (name.includes("conference") || categoriesStr.includes("conference")) {
    return UNSPLASH_IMAGES.conference;
  }
  if (name.includes("workshop") || categoriesStr.includes("workshop")) {
    return UNSPLASH_IMAGES.workshop;
  }
  if (name.includes("step") || categoriesStr.includes("step") || categoriesStr.includes("stepping")) {
    return UNSPLASH_IMAGES.stepping;
  }
  if (name.includes("dance") || categoriesStr.includes("dance")) {
    return UNSPLASH_IMAGES.dance;
  }
  if (name.includes("festival") || categoriesStr.includes("festival")) {
    return UNSPLASH_IMAGES.festival;
  }
  if (name.includes("concert") || categoriesStr.includes("concert")) {
    return UNSPLASH_IMAGES.concert;
  }
  if (name.includes("party") || categoriesStr.includes("party")) {
    return UNSPLASH_IMAGES.party;
  }

  return UNSPLASH_IMAGES.default;
}

async function fixEventImages() {
  console.log("🖼️  Fixing Event Images...\n");

  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // Get all published events
    console.log("📥 Fetching all published events...");
    const events = await client.query(api.public.queries.getPublishedEvents);

    console.log(`✓ Found ${events.length} total events\n`);

    // Find events without images OR with broken URLs
    const eventsWithoutImages = events.filter(event =>
      !event.imageUrl ||
      event.imageUrl.startsWith('/api/flyers/') ||
      (event.imageUrl.includes('unsplash.com') && !event.imageUrl.includes('auto=format'))
    );

    console.log(`🔍 Found ${eventsWithoutImages.length} events without images\n`);

    if (eventsWithoutImages.length === 0) {
      console.log("✅ All events already have images!");
      return;
    }

    // Update each event
    let updated = 0;
    for (const event of eventsWithoutImages) {
      const imageUrl = selectImageForEvent(event);

      console.log(`📝 Updating: ${event.name}`);
      console.log(`   Categories: ${event.categories?.join(", ") || "None"}`);
      console.log(`   New Image: ${imageUrl.substring(0, 60)}...`);

      try {
        await client.mutation(api.events.mutations.updateEvent, {
          eventId: event._id,
          imageUrl: imageUrl,
        });

        console.log(`   ✅ Updated!\n`);
        updated++;
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}\n`);
      }
    }

    console.log(`\n🎉 Done! Updated ${updated}/${eventsWithoutImages.length} events`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the script
fixEventImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
