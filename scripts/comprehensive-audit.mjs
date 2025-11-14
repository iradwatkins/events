#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function comprehensiveAudit() {
  console.log('🔍 COMPREHENSIVE SITE AUDIT\n');
  console.log('═══════════════════════════════════════════════════════\n');

  const issues = [];
  const warnings = [];
  const passed = [];

  // 1. CHECK EVENTS
  console.log('1️⃣  CHECKING EVENTS...');
  const events = await client.query(api.public.queries.getPublishedEvents, {});
  console.log('   Found', events.length, 'published events');

  for (const event of events) {
    // Check image
    if (!event.imageUrl) {
      issues.push(`Event "${event.name}" has no image`);
    } else if (event.imageUrl && event.imageUrl.includes('/api/storage/') && event.imageUrl.length < 100) {
      // Check if it's a direct storage ID (short URL) vs signed URL (long UUID)
      const isDirectStorageId = /\/api\/storage\/[a-z0-9]{32}$/.test(event.imageUrl);
      if (isDirectStorageId) {
        issues.push(`Event "${event.name}" has invalid image URL (not signed)`);
      }
    }

    // Check basic fields
    if (!event.name) issues.push(`Event ${event._id} has no name`);
    if (!event.location) warnings.push(`Event "${event.name}" has no location`);
    if (!event.startDate) warnings.push(`Event "${event.name}" has no start date`);

    // Check tickets
    const tiers = await client.query(api.events.queries.getEventTicketTiers, { eventId: event._id });
    if (!tiers || tiers.length === 0) {
      issues.push(`Event "${event.name}" has no ticket tiers`);
    }

    // Check payment config
    const paymentConfig = await client.query(api.events.queries.getPaymentConfig, { eventId: event._id });
    if (!paymentConfig) {
      issues.push(`Event "${event.name}" has no payment config`);
    } else if (!paymentConfig.isActive) {
      warnings.push(`Event "${event.name}" payment config is not active`);
    }
  }

  if (events.length > 0) passed.push('✓ Events exist and are published');
  console.log('   Done\n');

  // 2. CHECK TICKETS
  console.log('2️⃣  CHECKING TICKETS...');
  let totalTiers = 0;
  let activeTiers = 0;
  let soldTickets = 0;

  for (const event of events) {
    const tiers = await client.query(api.events.queries.getEventTicketTiers, { eventId: event._id });
    totalTiers += tiers?.length || 0;
    activeTiers += tiers?.filter(t => t.isActive).length || 0;
    soldTickets += tiers?.reduce((sum, t) => sum + (t.sold || 0), 0) || 0;
  }

  console.log('   - Total ticket tiers:', totalTiers);
  console.log('   - Active tiers:', activeTiers);
  console.log('   - Tickets sold:', soldTickets);

  if (totalTiers > 0) passed.push('✓ Ticket tiers configured');
  if (activeTiers === 0 && totalTiers > 0) warnings.push('No active ticket tiers');
  console.log('   Done\n');

  // 3. CHECK IMAGES
  console.log('3️⃣  CHECKING IMAGES...');
  let imagesWithStorage = 0;
  let imagesWithUrl = 0;
  let brokenImages = 0;

  for (const event of events) {
    if (event.images && event.images.length > 0) imagesWithStorage++;
    if (event.imageUrl) imagesWithUrl++;
    // Check if it's a broken direct storage ID URL
    if (event.imageUrl && event.imageUrl.includes('/api/storage/')) {
      const isDirectStorageId = /\/api\/storage\/[a-z0-9]{32}$/.test(event.imageUrl);
      if (isDirectStorageId) brokenImages++;
    }
  }

  console.log('   - Events with storage IDs:', imagesWithStorage);
  console.log('   - Events with imageUrl:', imagesWithUrl);
  console.log('   - Broken image URLs:', brokenImages);

  if (brokenImages > 0) issues.push(`${brokenImages} events have broken image URLs`);
  else passed.push('✓ All images properly configured');
  console.log('   Done\n');

  // 4. CHECK DATABASE INTEGRITY
  console.log('4️⃣  CHECKING DATABASE INTEGRITY...');

  for (const event of events) {
    // Check organizerId exists
    if (!event.organizerId) {
      issues.push(`Event "${event.name}" has no organizer ID`);
    }

    // Check event type
    if (!event.eventType) {
      warnings.push(`Event "${event.name}" has no event type`);
    }

    // Check capacity for ticketed events
    if (event.eventType === 'TICKETED_EVENT' && !event.capacity) {
      issues.push(`Event "${event.name}" is ticketed but has no capacity`);
    }
  }

  passed.push('✓ Database integrity checked');
  console.log('   Done\n');

  // SUMMARY
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 AUDIT SUMMARY\n');

  console.log(`✅ PASSED (${passed.length}):`);
  passed.forEach(p => console.log('   ' + p));
  console.log('');

  console.log(`⚠️  WARNINGS (${warnings.length}):`);
  if (warnings.length === 0) console.log('   None');
  else warnings.forEach(w => console.log('   ⚠️  ' + w));
  console.log('');

  console.log(`❌ CRITICAL ISSUES (${issues.length}):`);
  if (issues.length === 0) console.log('   None');
  else issues.forEach(i => console.log('   ❌ ' + i));
  console.log('');

  console.log('═══════════════════════════════════════════════════════');

  // Return stats
  return { passed: passed.length, warnings: warnings.length, issues: issues.length };
}

comprehensiveAudit().catch(console.error);
