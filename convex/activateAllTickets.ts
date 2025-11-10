import { mutation } from "./_generated/server";

/**
 * Activate all tickets for all events
 * Sets ticketsVisible=true and creates/activates payment configs
 */
export const activateAllTickets = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("[activateAllTickets] Starting ticket activation...");

    // Get all TICKETED_EVENT events
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("eventType"), "TICKETED_EVENT"))
      .collect();

    console.log(`[activateAllTickets] Found ${events.length} ticketed events`);

    let updated = 0;
    let paymentConfigsCreated = 0;

    for (const event of events) {
      // Update event to set ticketsVisible
      await ctx.db.patch(event._id, {
        ticketsVisible: true,
      });
      updated++;
      console.log(`[activateAllTickets] Set ticketsVisible for: ${event.name}`);

      // Check if payment config exists
      const paymentConfig = await ctx.db
        .query("eventPaymentConfig")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .first();

      if (!paymentConfig) {
        // Create payment config with PREPAY model (cash payment by default)
        await ctx.db.insert("eventPaymentConfig", {
          eventId: event._id,
          organizerId: event.organizerId!,
          paymentModel: "PREPAY",
          isActive: true,
          activatedAt: Date.now(),
          platformFeePercent: 0,       // No platform fee for prepay
          platformFeeFixed: 0,         // No fixed fee for prepay
          processingFeePercent: 2.9,   // Only Stripe processing fee if using cards
          charityDiscount: false,
          lowPriceDiscount: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        paymentConfigsCreated++;
        console.log(`[activateAllTickets] Created PREPAY (cash) payment config for: ${event.name}`);
      } else if (!paymentConfig.isActive) {
        // Activate existing payment config
        await ctx.db.patch(paymentConfig._id, {
          isActive: true,
          activatedAt: Date.now(),
          updatedAt: Date.now(),
        });
        paymentConfigsCreated++;
        console.log(`[activateAllTickets] Activated payment config for: ${event.name}`);
      } else {
        console.log(`[activateAllTickets] Payment config already active for: ${event.name}`);
      }
    }

    console.log(`[activateAllTickets] Complete: ${updated} events updated, ${paymentConfigsCreated} payment configs created/activated`);

    return {
      success: true,
      eventsUpdated: updated,
      paymentConfigsCreated,
    };
  },
});
