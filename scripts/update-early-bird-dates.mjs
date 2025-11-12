import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

// Tier IDs from the event
const TIER_GA = "k970wewzpgfm2rtdwwgtasz0wx7v6wc5";
const TIER_VIP = "k979g6rqe0bbraknrag6v5ceq57v6g41";

async function updateEarlyBirdDates() {
  console.log("🎯 Updating Early Bird pricing to current dates...\n");

  try {
    const now = Date.now();
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
    const fourteenDaysFromNow = now + (14 * 24 * 60 * 60 * 1000);

    console.log("Updating General Admission early bird pricing...");
    await client.mutation(api.tickets.mutations.updateTicketTier, {
      tierId: TIER_GA,
      pricingTiers: [
        {
          name: "Early Bird Special",
          price: 2500,
          availableFrom: now,
          availableUntil: sevenDaysFromNow
        },
        {
          name: "Regular Price",
          price: 3000,
          availableFrom: sevenDaysFromNow
        }
      ]
    });
    console.log("✅ General Admission updated - Early Bird $25 active NOW for 7 days");

    console.log("\nUpdating VIP Individual early bird pricing...");
    await client.mutation(api.tickets.mutations.updateTicketTier, {
      tierId: TIER_VIP,
      pricingTiers: [
        {
          name: "Early Bird VIP",
          price: 6000,
          availableFrom: now,
          availableUntil: fourteenDaysFromNow
        },
        {
          name: "Regular VIP Price",
          price: 7500,
          availableFrom: fourteenDaysFromNow
        }
      ]
    });
    console.log("✅ VIP Individual updated - Early Bird $60 active NOW for 14 days");

    console.log("\n" + "=".repeat(70));
    console.log("✅ EARLY BIRD PRICING IS NOW LIVE!");
    console.log("=".repeat(70));

    console.log("\n🎫 Current Pricing:");
    console.log("   General Admission: $25 (Early Bird) → $30 (in 7 days)");
    console.log("   VIP Individual: $60 (Early Bird) → $75 (in 14 days)");
    console.log("   VIP Table (8 seats): $500");
    console.log("   Premium Table (10 seats): $800");
    console.log("   Door Price: $40");

    console.log("\n🌐 View Event:");
    console.log("   https://events.stepperslife.com/events/jh72wsebqa27cb8zzqw2bqvxan7v639n");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

updateEarlyBirdDates()
  .then(() => {
    console.log("\n✅ Update completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Update failed:", error);
    process.exit(1);
  });
