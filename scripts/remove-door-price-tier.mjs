import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");
const EVENT_ID = "jh72wsebqa27cb8zzqw2bqvxan7v639n";

async function removeDoorPriceTier() {
  console.log("🎫 Removing Door Price ticket tier...\n");

  try {
    // Get all ticket tiers for the event
    const tiers = await client.query(api.events.queries.getEventTicketTiers, {
      eventId: EVENT_ID
    });

    console.log(`Found ${tiers.length} ticket tiers`);

    // Find the Door Price tier
    const doorPriceTier = tiers.find(t => t.name === "Door Price");

    if (!doorPriceTier) {
      console.log("❌ Door Price tier not found");
      return;
    }

    console.log(`\nFound Door Price tier:`);
    console.log(`   ID: ${doorPriceTier._id}`);
    console.log(`   Name: ${doorPriceTier.name}`);
    console.log(`   Price: $${(doorPriceTier.price / 100).toFixed(2)}`);
    console.log(`   Quantity: ${doorPriceTier.quantity}`);

    // Delete the tier
    await client.mutation(api.tickets.mutations.deleteTicketTier, {
      tierId: doorPriceTier._id
    });

    console.log("\n✅ Door Price tier removed successfully!");

    // Show remaining tiers
    const remainingTiers = await client.query(api.events.queries.getEventTicketTiers, {
      eventId: EVENT_ID
    });

    console.log(`\n📊 Remaining ticket tiers (${remainingTiers.length}):`);
    remainingTiers.forEach((tier, index) => {
      console.log(`\n${index + 1}. ${tier.name}`);
      console.log(`   Price: $${(tier.price / 100).toFixed(2)}`);
      console.log(`   Quantity: ${tier.quantity}`);
      if (tier.isTablePackage) {
        console.log(`   Table Package: ${tier.tableCapacity} seats per table`);
      }
    });

    const totalCapacity = remainingTiers.reduce((sum, tier) => {
      if (tier.isTablePackage) {
        return sum + (tier.quantity * (tier.tableCapacity || 1));
      }
      return sum + tier.quantity;
    }, 0);

    console.log(`\n📈 Total capacity: ${totalCapacity} tickets`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

removeDoorPriceTier()
  .then(() => {
    console.log("\n✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
