#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function fixAllIssues() {
  console.log('🔧 FIXING ALL SITE ISSUES\n');

  const events = await client.query(api.public.queries.getPublishedEvents, {});

  let fixed = 0;
  let errors = 0;

  // FIX 1: Clear broken image URLs
  console.log('1️⃣  Fixing broken image URLs...');
  for (const event of events) {
    if (event.imageUrl && !event.imageUrl.includes('?')) {
      console.log(`   Clearing broken imageUrl for: ${event.name}`);
      try {
        await client.mutation(api.events.mutations.updateEvent, {
          eventId: event._id,
          imageUrl: '',
        });
        fixed++;
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errors++;
      }
    }
  }
  console.log('');

  // FIX 2: Create payment configs for events without them
  console.log('2️⃣  Creating missing payment configs...');
  for (const event of events) {
    const paymentConfig = await client.query(api.events.queries.getPaymentConfig, { eventId: event._id });

    if (!paymentConfig) {
      console.log(`   Creating payment config for: ${event.name}`);
      try {
        // We can't call the mutation directly without auth, so we'll need to run the internal mutation
        console.log(`   ℹ️  Need to run: npx convex run testing/setupPaymentConfigs:createBasicPaymentConfigs`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errors++;
      }
    }
  }
  console.log('');

  // REPORT
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ Fixed: ${fixed} issues`);
  console.log(`❌ Errors: ${errors}`);
  console.log('');
  console.log('ℹ️  MANUAL STEPS NEEDED:');
  console.log('   1. Run: npx convex run testing/setupPaymentConfigs:createBasicPaymentConfigs');
  console.log('   2. Add images to events without them via UI');
  console.log('   3. Create ticket tiers for "Bobby Soul." event');
  console.log('═══════════════════════════════════════════════════════');
}

fixAllIssues().catch(console.error);
