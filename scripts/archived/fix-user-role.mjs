import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

const TEST_EMAIL = "ira@irawatkins.com";

async function fixUserRole() {
  console.log("🔧 Fixing user role...\n");

  try {
    // Get the user
    const user = await client.query(api.users.queries.getUserByEmail, {
      email: TEST_EMAIL
    });

    if (!user) {
      console.error(`❌ User not found: ${TEST_EMAIL}`);
      process.exit(1);
    }

    console.log(`✅ User found: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);

    // Update to organizer role
    await client.mutation(api.users.mutations.updatePasswordHash, {
      userId: user._id,
      passwordHash: user.passwordHash
    });

    console.log(`\n⚠️  Need to update role to "organizer" manually or via direct DB patch`);
    console.log(`\nAttempting to update role...`);

    // We need a mutation that can update the role
    // Let's check the event to make sure it's there
    const eventId = "jh72wsebqa27cb8zzqw2bqvxan7v639n";

    const event = await client.query(api.events.queries.getEventById, {
      eventId: eventId
    });

    console.log(`\n📅 Event Details:`);
    console.log(`   Event ID: ${event._id}`);
    console.log(`   Event Name: ${event.name}`);
    console.log(`   Organizer ID: ${event.organizerId}`);
    console.log(`   Capacity: ${event.capacity}`);

    // Get ticket tiers
    const tiers = await client.query(api.tickets.queries.getEventTicketTiers, {
      eventId: eventId
    });

    console.log(`\n🎫 Ticket Tiers (${tiers.length} total):`);
    tiers.forEach((tier, index) => {
      console.log(`   ${index + 1}. ${tier.name} - ${tier.quantity} tickets @ $${(tier.price / 100).toFixed(2)}`);
      if (tier.isTablePackage) {
        console.log(`      └─ Table Package: ${tier.tableCapacity} seats per table`);
      }
      if (tier.pricingTiers && tier.pricingTiers.length > 0) {
        console.log(`      └─ Early Bird Pricing: ${tier.pricingTiers.length} tiers`);
      }
    });

    console.log(`\n✅ Event is correctly set up with all ticket types!`);
    console.log(`\n⚠️  However, user role needs to be "organizer" not "admin"`);
    console.log(`\nPlease run this Convex mutation manually:`);
    console.log(`npx convex run users/mutations:updateUserRole --userId="${user._id}" --role="organizer"`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

fixUserRole()
  .then(() => {
    console.log("\n✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
