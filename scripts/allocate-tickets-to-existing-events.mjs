import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const TICKETS_TO_ALLOCATE = 300;

const convex = new ConvexHttpClient(CONVEX_URL);

async function allocateTicketsToExistingEvents() {
  try {
    console.log("🎫 Allocating 300 tickets to all existing events...\n");

    // Get all events
    const allEvents = await convex.query(api.adminPanel.queries.getAllEvents);

    if (!allEvents || allEvents.length === 0) {
      console.log("⚠️  No events found in the database.");
      return;
    }

    console.log(`📊 Found ${allEvents.length} events\n`);

    let allocated = 0;
    let skipped = 0;
    let errors = 0;

    for (const event of allEvents) {
      try {
        // Check if event already has payment config
        const existingConfig = await convex.query(api.paymentConfig.queries.getEventPaymentConfig, {
          eventId: event._id,
        });

        if (existingConfig && existingConfig.ticketsAllocated) {
          console.log(`⏭️  ${event.name} - Already has ${existingConfig.ticketsAllocated} tickets allocated`);
          skipped++;
          continue;
        }

        // Check if event has an organizer
        if (!event.organizerId) {
          console.log(`⚠️  ${event.name} - No organizer assigned, skipping`);
          skipped++;
          continue;
        }

        // Allocate tickets using the allocation mutation
        await convex.mutation(api.events.allocations.createEventPaymentConfig, {
          eventId: event._id,
          organizerId: event.organizerId,
          ticketsAllocated: TICKETS_TO_ALLOCATE,
          paymentModel: "PREPAY",
        });

        console.log(`✅ ${event.name} - Allocated ${TICKETS_TO_ALLOCATE} tickets`);
        allocated++;
      } catch (error) {
        console.error(`❌ Error allocating tickets for "${event.name}":`, error.message);
        errors++;
      }
    }

    console.log("\n📊 Summary:");
    console.log(`   ✅ Allocated: ${allocated} events`);
    console.log(`   ⏭️  Skipped: ${skipped} events (already had allocation or no organizer)`);
    console.log(`   ❌ Errors: ${errors} events`);
    console.log(`   📝 Total: ${allEvents.length} events\n`);
  } catch (error) {
    console.error("❌ Error allocating tickets to events:", error);
    process.exit(1);
  }
}

allocateTicketsToExistingEvents();
