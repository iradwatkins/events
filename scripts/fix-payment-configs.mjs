#!/usr/bin/env node

/**
 * FIX PAYMENT CONFIGS - Create payment configs for all events
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function fixPaymentConfigs() {
  console.log('🔧 FIXING PAYMENT CONFIGS\n');

  const events = await client.query(api.public.queries.getPublishedEvents, {});

  console.log(`Found ${events.length} published events\n`);

  for (const event of events) {
    console.log(`Event: ${event.name}`);
    console.log(`  ID: ${event._id}`);

    // Check existing payment config
    const existing = await client.query(api.events.queries.getPaymentConfig, { eventId: event._id });

    if (existing) {
      console.log(`  ✓ Already has payment config (${existing.paymentModel})\n`);
      continue;
    }

    console.log(`  → Need to create payment config manually...`);
    console.log(`  ℹ️  Go to: https://events.stepperslife.com/organizer/events/${event._id}/payment-setup`);
    console.log(`  ℹ️  Select a payment model to activate tickets\n`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  MANUAL ACTION REQUIRED');
  console.log('');
  console.log('Payment configs cannot be created programmatically (require auth).');
  console.log('');
  console.log('TEMPORARY WORKAROUND:');
  console.log('Set ticketsVisible = true and isActive = true manually for testing.');
  console.log('');
}

fixPaymentConfigs().catch((error) => {
  console.error("\n❌ ERROR:", error);
  process.exit(1);
});
