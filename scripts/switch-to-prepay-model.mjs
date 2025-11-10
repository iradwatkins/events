/**
 * Switch event payment config from CREDIT_CARD to PREPAY model
 * This allows cash payments without requiring Stripe Connect
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function main() {
  console.log("💳 Switching payment model to PREPAY for Holiday Season Step Fest 2025...\n");

  const eventId = "jh71czqg7svp2z7xb7t0qrapk17tt650";

  try {
    // Get current payment config
    const paymentConfig = await client.query(api.paymentConfig.queries.getEventPaymentConfig, {
      eventId
    });

    if (!paymentConfig) {
      console.log("❌ No payment config found for this event");
      process.exit(1);
    }

    console.log("Current payment config:");
    console.log(`  Model: ${paymentConfig.paymentModel}`);
    console.log(`  Active: ${paymentConfig.isActive}`);
    console.log();

    // Update to PREPAY model using internal mutation
    const result = await client.mutation(api.updatePaymentModelToPrepay.updateToPrepay, {
      eventId,
    });

    console.log("✅ Payment model updated to PREPAY");
    console.log(`   Old model: ${result.oldModel}`);
    console.log(`   New model: ${result.newModel}`);
    console.log("\n   Event can now accept cash payments");
    console.log("   No Stripe Connect account required");
    console.log(`\n🌐 View event at: https://events.stepperslife.com/events/${eventId}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

main();
