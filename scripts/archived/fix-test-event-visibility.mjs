import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

const EVENT_ID = 'jh75kydzxb2xb1jj2rwnq1q8f97tvqfa';

console.log("🔧 Fixing Test Event Visibility");
console.log("================================\n");

async function fixEventVisibility() {
  try {
    // Configure payment (this also sets ticketsVisible to true)
    console.log("💳 Configuring payment (this will make tickets visible)...");
    await client.mutation(api.events.mutations.configurePayment, {
      eventId: EVENT_ID,
      model: "CREDIT_CARD",
    });
    console.log("✅ Payment configured and tickets are now visible\n");

    // Verify changes
    console.log("🔍 Verifying changes...");
    const event = await client.query(api.events.queries.getEventById, { eventId: EVENT_ID });
    const paymentConfig = await client.query(api.events.queries.getPaymentConfig, { eventId: EVENT_ID });

    console.log(`  • Tickets Visible: ${event.ticketsVisible}`);
    console.log(`  • Payment Config Active: ${paymentConfig?.isActive}`);
    console.log(`  • Payment Model: ${paymentConfig?.paymentModel || 'N/A'}`);
    console.log("");

    console.log("✅ Event is now ready for ticket sales!");
    console.log("");
    console.log("🔗 Test the event at:");
    console.log(`   Local: http://localhost:3004/events/${EVENT_ID}`);
    console.log(`   Production: https://events.stepperslife.com/events/${EVENT_ID}`);
    console.log("");
    console.log("🎫 Test a referral link:");
    console.log(`   https://events.stepperslife.com/events/${EVENT_ID}/checkout?ref=STAFFSFTFETM`);

  } catch (error) {
    console.error("❌ Error fixing event visibility:", error);
    throw error;
  }
}

// Run the fix
fixEventVisibility()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
