import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Create realistic test bundles for demonstration
 */
export const createTestBundles = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; bundles: any[] }> => {

    const bundles = [];

    // Find the New Year's Eve event (it has both VIP and GA tiers)
    const nyeEvent = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("name"), "New Year's Eve Stepping Celebration 2026"))
      .first();

    if (!nyeEvent) {
      throw new Error("New Year's Eve event not found. Please run createRealTestEvents first.");
    }

    // Get ticket tiers for NYE event
    const nyeTiers = await ctx.db
      .query("ticketTiers")
      .withIndex("by_event", (q) => q.eq("eventId", nyeEvent._id))
      .collect();

    const vipTier = nyeTiers.find((t) => t.name === "VIP Package");
    const gaTier = nyeTiers.find((t) => t.name === "General Admission");

    if (!vipTier || !gaTier) {
      throw new Error("NYE ticket tiers not found");
    }


    // Bundle 1: Date Night Package (2× GA)
    const dateNightId = await ctx.runMutation(api.bundles.mutations.createTicketBundle, {
      eventId: nyeEvent._id,
      name: "Date Night Package",
      description:
        "Perfect for couples! Two General Admission tickets to ring in the new year together. Save $10 when you buy as a bundle.",
      price: 19000, // $190 (normally $200 for 2×$100)
      includedTiers: [
        {
          tierId: gaTier._id,
          tierName: gaTier.name,
          quantity: 2,
        },
      ],
      totalQuantity: 50, // 50 bundles = 100 tickets
    });
    bundles.push({ bundleId: dateNightId, name: "Date Night Package" });

    // Bundle 2: Squad Goals (4× GA)
    const squadGoalsId = await ctx.runMutation(api.bundles.mutations.createTicketBundle, {
      eventId: nyeEvent._id,
      name: "Squad Goals",
      description:
        "Bring the crew! Four General Admission tickets so you and your friends can celebrate together. Save $40 with this group package.",
      price: 36000, // $360 (normally $400 for 4×$100)
      includedTiers: [
        {
          tierId: gaTier._id,
          tierName: gaTier.name,
          quantity: 4,
        },
      ],
      totalQuantity: 30, // 30 bundles = 120 tickets
    });
    bundles.push({ bundleId: squadGoalsId, name: "Squad Goals" });

    // Bundle 3: VIP Experience (1× VIP + 1× GA)
    const vipExpId = await ctx.runMutation(api.bundles.mutations.createTicketBundle, {
      eventId: nyeEvent._id,
      name: "VIP Experience",
      description:
        "Treat yourself and bring a guest! One VIP Package ticket with premium seating and bottle service, plus one General Admission ticket. Perfect for special occasions.",
      price: 23000, // $230 (normally $250 for $150+$100)
      includedTiers: [
        {
          tierId: vipTier._id,
          tierName: vipTier.name,
          quantity: 1,
        },
        {
          tierId: gaTier._id,
          tierName: gaTier.name,
          quantity: 1,
        },
      ],
      totalQuantity: 25, // 25 bundles
    });
    bundles.push({ bundleId: vipExpId, name: "VIP Experience" });

    // Bundle 4: Early Bird Triple (3× GA, time-limited)
    const now = Date.now();
    const earlyBirdEnd = new Date("2025-12-15T23:59:59").getTime(); // Available until Dec 15

    const earlyBirdId = await ctx.runMutation(api.bundles.mutations.createTicketBundle, {
      eventId: nyeEvent._id,
      name: "Early Bird Triple",
      description:
        "LIMITED TIME OFFER! Three General Admission tickets at a special early bird rate. Only available until December 15th - don't miss out!",
      price: 27000, // $270 (normally $300 for 3×$100)
      includedTiers: [
        {
          tierId: gaTier._id,
          tierName: gaTier.name,
          quantity: 3,
        },
      ],
      totalQuantity: 40, // 40 bundles = 120 tickets
      saleStart: now,
      saleEnd: earlyBirdEnd,
    });
    bundles.push({ bundleId: earlyBirdId, name: "Early Bird Triple" });


    return {
      success: true,
      bundles,
    };
  },
});
