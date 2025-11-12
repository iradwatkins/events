import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");
const EVENT_ID = "jh72wsebqa27cb8zzqw2bqvxan7v639n";
const TEST_EMAIL = "ira@irawatkins.com";

async function verifySetup() {
  console.log("🔍 Verifying Event Setup\n");
  console.log("=".repeat(80));

  try {
    // Get user
    const user = await client.query(api.users.queries.getUserByEmail, {
      email: TEST_EMAIL
    });

    console.log("\n👤 USER STATUS:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Has Password: ${user.passwordHash ? "✅ Yes" : "❌ No"}`);

    // Get event
    const event = await client.query(api.events.queries.getEventById, {
      eventId: EVENT_ID
    });

    console.log("\n📅 EVENT STATUS:");
    console.log(`   Name: ${event.name}`);
    console.log(`   Event ID: ${event._id}`);
    console.log(`   Status: ${event.status}`);
    console.log(`   Tickets Visible: ${event.ticketsVisible ? "✅ Yes" : "❌ No"}`);
    console.log(`   Payment Model Selected: ${event.paymentModelSelected ? "✅ Yes" : "❌ No"}`);
    console.log(`   Date: ${event.eventDateLiteral}`);
    console.log(`   Time: ${event.eventTimeLiteral}`);
    console.log(`   Venue: ${event.location.venueName}`);

    // Get ticket tiers from public query
    const publicEvent = await client.query(api.public.queries.getPublicEventDetails, {
      eventId: EVENT_ID
    });

    console.log("\n🎫 TICKET TIERS:");
    if (publicEvent.ticketTiers && publicEvent.ticketTiers.length > 0) {
      publicEvent.ticketTiers.forEach((tier, index) => {
        console.log(`\n   ${index + 1}. ${tier.name}`);
        console.log(`      Quantity: ${tier.quantity} tickets`);
        console.log(`      Price: $${(tier.price / 100).toFixed(2)}`);

        if (tier.isTablePackage) {
          console.log(`      ✨ TABLE PACKAGE: ${tier.tableCapacity} seats per table`);
          console.log(`      Total Seats: ${tier.quantity * tier.tableCapacity}`);
        }

        if (tier.pricingTiers && tier.pricingTiers.length > 0) {
          console.log(`      🎯 EARLY BIRD PRICING:`);
          tier.pricingTiers.forEach(pt => {
            console.log(`         - ${pt.name}: $${(pt.price / 100).toFixed(2)}`);
          });
        }

        console.log(`      Available: ${tier.available || tier.quantity} / ${tier.quantity}`);
      });

      const totalTickets = publicEvent.ticketTiers.reduce((sum, tier) => {
        if (tier.isTablePackage) {
          return sum + (tier.quantity * (tier.tableCapacity || 1));
        }
        return sum + tier.quantity;
      }, 0);

      console.log(`\n   📊 TOTAL CAPACITY: ${totalTickets} tickets across ${publicEvent.ticketTiers.length} tiers`);
    } else {
      console.log("   ❌ No ticket tiers found!");
    }

    // Get payment config
    const paymentConfig = await client.query(api.paymentConfig.queries.getEventPaymentConfig, {
      eventId: EVENT_ID
    });

    console.log("\n💳 PAYMENT CONFIG:");
    if (paymentConfig) {
      console.log(`   Model: ${paymentConfig.paymentModel}`);
      console.log(`   Active: ${paymentConfig.isActive ? "✅ Yes" : "❌ No"}`);
      console.log(`   Platform Fee: ${paymentConfig.platformFeePercent}% + $${(paymentConfig.platformFeeFixed / 100).toFixed(2)}`);
    } else {
      console.log("   ❌ No payment config found!");
    }

    // Get credits
    const credits = await client.query(api.credits.queries.getOrganizerCredits, {
      organizerId: user._id
    });

    console.log("\n💰 CREDITS:");
    if (credits) {
      console.log(`   Total: ${credits.creditsTotal}`);
      console.log(`   Used: ${credits.creditsUsed}`);
      console.log(`   Remaining: ${credits.creditsRemaining}`);
    } else {
      console.log("   ❌ No credits found!");
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ SETUP VERIFICATION COMPLETE");
    console.log("=".repeat(80));

    console.log("\n🔗 ACCESS URLS:");
    console.log(`   Login: https://events.stepperslife.com/login`);
    console.log(`   Event Page: https://events.stepperslife.com/events/${EVENT_ID}`);
    console.log(`   Organizer Dashboard: https://events.stepperslife.com/organizer/events`);

    console.log("\n🔑 LOGIN CREDENTIALS:");
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: TestPass123!`);
    console.log(`   Role: ${user.role}`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

verifySetup()
  .then(() => {
    console.log("\n✅ Verification complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  });
