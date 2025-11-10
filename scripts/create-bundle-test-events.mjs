#!/usr/bin/env node

/**
 * Create Comprehensive Bundle Test Events
 *
 * Creates 27 events across 9 scenarios with 12 ticket bundles demonstrating:
 * - Multi-day weekend bundles
 * - Same-day multi-event bundles
 * - Complex mixed bundles
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

const ORGANIZER_EMAIL = "iradwatkins@gmail.com";
const ORGANIZER_NAME = "Test Organizer";

console.log("🎫 Creating Comprehensive Bundle Test Events\n");
console.log(`📡 Convex URL: ${CONVEX_URL}\n`);

// Helper function to create event
async function createEvent(eventData) {
  console.log(`📅 Creating: ${eventData.name}`);

  const eventId = await client.mutation(api.events.mutations.createEvent, {
    name: eventData.name,
    eventType: "TICKETED_EVENT",
    description: eventData.description,
    categories: eventData.categories || ["Steppers", "Social Dance"],
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    timezone: eventData.timezone || "America/Chicago",
    location: eventData.location || {
      venueName: "Chicago Steppers Paradise",
      address: "123 Stepping Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "US",
    },
    capacity: eventData.capacity || 200,
  });

  console.log(`   ✓ Created event: ${eventId}`);
  return eventId;
}

// Helper function to create ticket tiers
async function createTicketTier(eventId, tierData) {
  console.log(`   🎟️  Creating tier: ${tierData.name} - $${tierData.price / 100}`);

  const tierId = await client.mutation(api.tickets.mutations.createTicketTier, {
    eventId,
    name: tierData.name,
    description: tierData.description,
    price: tierData.price,
    quantity: tierData.quantity || 100,
  });

  console.log(`      ✓ Tier created: ${tierId}`);
  return tierId;
}

// Helper function to create bundle
async function createBundle(bundleData) {
  console.log(`\n   🎁 Creating bundle: ${bundleData.name}`);
  console.log(`      Events: ${bundleData.eventIds.length}`);
  console.log(`      Price: $${bundleData.price / 100} (saves $${bundleData.savings / 100})`);

  const bundleArgs = {
    bundleType: bundleData.bundleType,
    eventId: bundleData.eventId,
    eventIds: bundleData.eventIds,
    name: bundleData.name,
    description: bundleData.description,
    price: bundleData.price,
    totalQuantity: bundleData.totalQuantity || 50,
  };

  // Use correct field based on bundle type
  if (bundleData.bundleType === "MULTI_EVENT") {
    bundleArgs.includedTiersWithEvents = bundleData.includedTiers;
  } else {
    bundleArgs.includedTiers = bundleData.includedTiers;
  }

  const bundleId = await client.mutation(api.bundles.mutations.createTicketBundle, bundleArgs);

  console.log(`      ✓ Bundle created: ${bundleId}`);
  return bundleId;
}

// Helper function to activate event (NOTE: We'll activate all at the end)
async function activateEvent(eventId) {
  // NOTE: We don't activate individually - we'll use activateAllTickets mutation at the end
  // This is just a placeholder for the script flow
  return;
}

// =================================================================
// SCENARIO 1: Memorial Day Weekend (Multi-Day Bundle)
// =================================================================
async function createMemorialDayWeekend() {
  console.log("\n🎯 SCENARIO 1: Memorial Day Weekend (Multi-Day Bundle)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const eventIds = [];
  const tierMap = {};

  // Friday Night Dance
  const friday = await createEvent({
    name: "Memorial Day Weekend - Friday Night Dance",
    description: "Kick off Memorial Day weekend with an incredible night of Chicago stepping!",
    startDate: new Date("2026-05-23T20:00:00").getTime(),
    endDate: new Date("2026-05-24T00:00:00").getTime(),
  });
  eventIds.push(friday);

  tierMap.fridayGA = await createTicketTier(friday, {
    name: "General Admission",
    description: "Friday GA ticket",
    price: 3500, // $35
  });

  tierMap.fridayVIP = await createTicketTier(friday, {
    name: "VIP",
    description: "Friday VIP ticket with priority seating",
    price: 5000, // $50
  });

  await activateEvent(friday);

  // Saturday Night Social
  const saturday = await createEvent({
    name: "Memorial Day Weekend - Saturday Night Social",
    description: "The biggest social dance of the weekend!",
    startDate: new Date("2026-05-24T20:00:00").getTime(),
    endDate: new Date("2026-05-25T01:00:00").getTime(),
  });
  eventIds.push(saturday);

  tierMap.saturdayGA = await createTicketTier(saturday, {
    name: "General Admission",
    description: "Saturday GA ticket",
    price: 4000, // $40
  });

  tierMap.saturdayVIP = await createTicketTier(saturday, {
    name: "VIP",
    description: "Saturday VIP ticket with priority seating",
    price: 6000, // $60
  });

  await activateEvent(saturday);

  // Sunday Afternoon Brunch & Dance
  const sunday = await createEvent({
    name: "Memorial Day Weekend - Sunday Brunch & Dance",
    description: "Close out the weekend with brunch and stepping!",
    startDate: new Date("2026-05-25T14:00:00").getTime(),
    endDate: new Date("2026-05-25T18:00:00").getTime(),
  });
  eventIds.push(sunday);

  tierMap.sundayGA = await createTicketTier(sunday, {
    name: "General Admission",
    description: "Sunday GA ticket",
    price: 3000, // $30
  });

  tierMap.sundayVIP = await createTicketTier(sunday, {
    name: "VIP",
    description: "Sunday VIP ticket with priority seating",
    price: 4500, // $45
  });

  await activateEvent(sunday);

  // Create Weekend Bundle
  await createBundle({
    bundleType: "MULTI_EVENT",
    eventId: eventIds[0],
    eventIds,
    name: "Memorial Day Weekend Pass",
    description: "All 3 events - Friday, Saturday, Sunday with GA tickets. Save $20!",
    price: 8500, // $85 (saves $20 from $105)
    savings: 2000,
    includedTiers: [
      { tierId: tierMap.fridayGA, tierName: "General Admission", quantity: 1, eventId: friday, eventName: "Friday Night Dance" },
      { tierId: tierMap.saturdayGA, tierName: "General Admission", quantity: 1, eventId: saturday, eventName: "Saturday Night Social" },
      { tierId: tierMap.sundayGA, tierName: "General Admission", quantity: 1, eventId: sunday, eventName: "Sunday Brunch & Dance" },
    ],
  });

  console.log(`\n✅ Memorial Day Weekend complete: 3 events, 1 bundle\n`);
  return { eventIds, tierMap };
}

// =================================================================
// SCENARIO 2: Labor Day Weekend (Multi-Day Bundle - VIP)
// =================================================================
async function createLaborDayWeekend() {
  console.log("\n🎯 SCENARIO 2: Labor Day Weekend (Multi-Day Bundle - VIP)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const eventIds = [];
  const tierMap = {};

  // Friday Night Steppers Set
  const friday = await createEvent({
    name: "Labor Day Weekend - Friday Night Steppers Set",
    description: "Labor Day weekend starts with the best steppers in Chicago!",
    startDate: new Date("2026-08-29T21:00:00").getTime(),
    endDate: new Date("2026-08-30T01:00:00").getTime(),
  });
  eventIds.push(friday);

  tierMap.fridayGA = await createTicketTier(friday, {
    name: "General Admission",
    description: "Friday GA ticket",
    price: 3000, // $30
  });

  tierMap.fridayVIP = await createTicketTier(friday, {
    name: "VIP All Access",
    description: "Friday VIP with reserved seating and drink tickets",
    price: 5500, // $55
  });

  await activateEvent(friday);

  // Saturday Championship Night
  const saturday = await createEvent({
    name: "Labor Day Weekend - Championship Night",
    description: "Annual Labor Day Championship with top steppers competing!",
    startDate: new Date("2026-08-30T20:00:00").getTime(),
    endDate: new Date("2026-08-31T02:00:00").getTime(),
  });
  eventIds.push(saturday);

  tierMap.saturdayGA = await createTicketTier(saturday, {
    name: "General Admission",
    description: "Saturday GA ticket",
    price: 5000, // $50
  });

  tierMap.saturdayVIP = await createTicketTier(saturday, {
    name: "VIP All Access",
    description: "Saturday VIP with reserved seating and drink tickets",
    price: 7500, // $75
  });

  await activateEvent(saturday);

  // Sunday Farewell Social
  const sunday = await createEvent({
    name: "Labor Day Weekend - Farewell Social",
    description: "One last dance before the summer ends!",
    startDate: new Date("2026-08-31T18:00:00").getTime(),
    endDate: new Date("2026-08-31T23:00:00").getTime(),
  });
  eventIds.push(sunday);

  tierMap.sundayGA = await createTicketTier(sunday, {
    name: "General Admission",
    description: "Sunday GA ticket",
    price: 2500, // $25
  });

  tierMap.sundayVIP = await createTicketTier(sunday, {
    name: "VIP All Access",
    description: "Sunday VIP with reserved seating and drink tickets",
    price: 4000, // $40
  });

  await activateEvent(sunday);

  // Create VIP Weekend Bundle
  await createBundle({
    bundleType: "MULTI_EVENT",
    eventId: eventIds[0],
    eventIds,
    name: "Labor Day All Access VIP Pass",
    description: "VIP access to all 3 events - Friday, Saturday, Sunday. Save $30!",
    price: 14000, // $140 (saves $30 from $170)
    savings: 3000,
    includedTiers: [
      { tierId: tierMap.fridayVIP, tierName: "VIP All Access", quantity: 1, eventId: friday, eventName: "Friday Night Steppers Set" },
      { tierId: tierMap.saturdayVIP, tierName: "VIP All Access", quantity: 1, eventId: saturday, eventName: "Championship Night" },
      { tierId: tierMap.sundayVIP, tierName: "VIP All Access", quantity: 1, eventId: sunday, eventName: "Farewell Social" },
    ],
  });

  console.log(`\n✅ Labor Day Weekend complete: 3 events, 1 bundle\n`);
  return { eventIds, tierMap };
}

// =================================================================
// SCENARIO 3: Juneteenth Weekend (Multi-Day Bundle - Mixed Tiers)
// =================================================================
async function createJuneteenthWeekend() {
  console.log("\n🎯 SCENARIO 3: Juneteenth Weekend (Multi-Day Bundle - Mixed)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const eventIds = [];
  const tierMap = {};

  // Friday Kickoff Party
  const friday = await createEvent({
    name: "Juneteenth Weekend - Friday Kickoff Party",
    description: "Celebrate Juneteenth with Chicago stepping!",
    startDate: new Date("2026-06-20T20:00:00").getTime(),
    endDate: new Date("2026-06-21T00:00:00").getTime(),
  });
  eventIds.push(friday);

  tierMap.fridayGA = await createTicketTier(friday, {
    name: "General Admission",
    description: "Friday GA ticket",
    price: 2500, // $25
  });

  tierMap.fridayVIP = await createTicketTier(friday, {
    name: "VIP",
    description: "Friday VIP ticket",
    price: 4500, // $45
  });

  await activateEvent(friday);

  // Saturday Celebration Dance
  const saturday = await createEvent({
    name: "Juneteenth Weekend - Saturday Celebration Dance",
    description: "The biggest Juneteenth celebration in Chicago!",
    startDate: new Date("2026-06-21T19:00:00").getTime(),
    endDate: new Date("2026-06-22T01:00:00").getTime(),
  });
  eventIds.push(saturday);

  tierMap.saturdayGA = await createTicketTier(saturday, {
    name: "General Admission",
    description: "Saturday GA ticket",
    price: 4500, // $45
  });

  tierMap.saturdayVIP = await createTicketTier(saturday, {
    name: "VIP",
    description: "Saturday VIP ticket",
    price: 6500, // $65
  });

  await activateEvent(saturday);

  // Sunday Unity Brunch
  const sunday = await createEvent({
    name: "Juneteenth Weekend - Sunday Unity Brunch",
    description: "Community brunch and stepping celebration!",
    startDate: new Date("2026-06-22T13:00:00").getTime(),
    endDate: new Date("2026-06-22T17:00:00").getTime(),
  });
  eventIds.push(sunday);

  tierMap.sundayGA = await createTicketTier(sunday, {
    name: "General Admission",
    description: "Sunday GA ticket",
    price: 3500, // $35
  });

  tierMap.sundayVIP = await createTicketTier(sunday, {
    name: "VIP",
    description: "Sunday VIP ticket",
    price: 5000, // $50
  });

  await activateEvent(sunday);

  // Create Mixed Bundle (2 GA + 1 VIP)
  await createBundle({
    bundleType: "MULTI_EVENT",
    eventId: eventIds[0],
    eventIds,
    name: "Juneteenth Full Experience",
    description: "All 3 events with mixed tickets (Friday GA, Saturday GA, Sunday VIP). Save $15!",
    price: 9000, // $90 (saves $15 from $105)
    savings: 1500,
    includedTiers: [
      { tierId: tierMap.fridayGA, tierName: "General Admission", quantity: 1, eventId: friday, eventName: "Friday Kickoff Party" },
      { tierId: tierMap.saturdayGA, tierName: "General Admission", quantity: 1, eventId: saturday, eventName: "Saturday Celebration Dance" },
      { tierId: tierMap.sundayVIP, tierName: "VIP", quantity: 1, eventId: sunday, eventName: "Sunday Unity Brunch" },
    ],
  });

  console.log(`\n✅ Juneteenth Weekend complete: 3 events, 1 bundle\n`);
  return { eventIds, tierMap };
}

// =================================================================
// SCENARIO 4: Valentine's Day (Same-Day Multi-Event)
// =================================================================
async function createValentinesDay() {
  console.log("\n🎯 SCENARIO 4: Valentine's Day (Same-Day Multi-Event)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const eventIds = [];
  const tierMap = {};

  // Morning Workshop
  const morning = await createEvent({
    name: "Valentine's Day - Beginner's Workshop",
    description: "Learn the basics of Chicago stepping with your partner!",
    startDate: new Date("2026-02-14T10:00:00").getTime(),
    endDate: new Date("2026-02-14T13:00:00").getTime(),
  });
  eventIds.push(morning);

  tierMap.morningEarly = await createTicketTier(morning, {
    name: "Early Bird",
    description: "Early bird workshop ticket",
    price: 4000, // $40
  });

  tierMap.morningRegular = await createTicketTier(morning, {
    name: "Regular",
    description: "Regular workshop ticket",
    price: 5000, // $50
  });

  await activateEvent(morning);

  // Afternoon Couples Social
  const afternoon = await createEvent({
    name: "Valentine's Day - Couples Social",
    description: "Afternoon social dance for couples!",
    startDate: new Date("2026-02-14T15:00:00").getTime(),
    endDate: new Date("2026-02-14T18:00:00").getTime(),
  });
  eventIds.push(afternoon);

  tierMap.afternoonEarly = await createTicketTier(afternoon, {
    name: "Early Bird",
    description: "Early bird social ticket",
    price: 3500, // $35
  });

  tierMap.afternoonRegular = await createTicketTier(afternoon, {
    name: "Regular",
    description: "Regular social ticket",
    price: 4500, // $45
  });

  await activateEvent(afternoon);

  // Evening Dance
  const evening = await createEvent({
    name: "Valentine's Day - Evening Romance Dance",
    description: "Romantic evening of stepping under the stars!",
    startDate: new Date("2026-02-14T20:00:00").getTime(),
    endDate: new Date("2026-02-15T00:00:00").getTime(),
  });
  eventIds.push(evening);

  tierMap.eveningEarly = await createTicketTier(evening, {
    name: "Early Bird",
    description: "Early bird evening ticket",
    price: 5000, // $50
  });

  tierMap.eveningRegular = await createTicketTier(evening, {
    name: "Regular",
    description: "Regular evening ticket",
    price: 6500, // $65
  });

  await activateEvent(evening);

  // Create Full Day Bundle
  await createBundle({
    bundleType: "MULTI_EVENT",
    eventId: eventIds[0],
    eventIds,
    name: "Valentine's Day Romance Package",
    description: "Full day of love and stepping! Morning workshop, afternoon social, and evening dance. Save $40!",
    price: 12000, // $120 (saves $40 from $160)
    savings: 4000,
    includedTiers: [
      { tierId: tierMap.morningRegular, tierName: "Regular", quantity: 1, eventId: morning, eventName: "Beginner's Workshop" },
      { tierId: tierMap.afternoonRegular, tierName: "Regular", quantity: 1, eventId: afternoon, eventName: "Couples Social" },
      { tierId: tierMap.eveningRegular, tierName: "Regular", quantity: 1, eventId: evening, eventName: "Evening Romance Dance" },
    ],
  });

  console.log(`\n✅ Valentine's Day complete: 3 events, 1 bundle\n`);
  return { eventIds, tierMap };
}

// =================================================================
// SCENARIO 5: New Year's Day (Same-Day Multi-Event)
// =================================================================
async function createNewYearsDay() {
  console.log("\n🎯 SCENARIO 5: New Year's Day (Same-Day Multi-Event)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const eventIds = [];
  const tierMap = {};

  // Morning Brunch
  const morning = await createEvent({
    name: "New Year's Day - Recovery Brunch & Light Stepping",
    description: "Start the new year with brunch and easy stepping!",
    startDate: new Date("2026-01-01T11:00:00").getTime(),
    endDate: new Date("2026-01-01T14:00:00").getTime(),
  });
  eventIds.push(morning);

  tierMap.morningGA = await createTicketTier(morning, {
    name: "General Admission",
    description: "Brunch ticket",
    price: 3000, // $30
  });

  await activateEvent(morning);

  // Afternoon Social
  const afternoon = await createEvent({
    name: "New Year's Day - Afternoon Social",
    description: "Afternoon stepping to ring in the new year!",
    startDate: new Date("2026-01-01T16:00:00").getTime(),
    endDate: new Date("2026-01-01T19:00:00").getTime(),
  });
  eventIds.push(afternoon);

  tierMap.afternoonGA = await createTicketTier(afternoon, {
    name: "General Admission",
    description: "Afternoon social ticket",
    price: 3500, // $35
  });

  await activateEvent(afternoon);

  // Evening Dance
  const evening = await createEvent({
    name: "New Year's Day - First Dance of the Year",
    description: "The first big dance of 2025!",
    startDate: new Date("2026-01-01T21:00:00").getTime(),
    endDate: new Date("2026-01-02T02:00:00").getTime(),
  });
  eventIds.push(evening);

  tierMap.eveningGA = await createTicketTier(evening, {
    name: "General Admission",
    description: "Evening dance GA ticket",
    price: 4500, // $45
  });

  tierMap.eveningVIP = await createTicketTier(evening, {
    name: "VIP",
    description: "Evening dance VIP ticket",
    price: 7000, // $70
  });

  await activateEvent(evening);

  // Create Full Day Bundle
  await createBundle({
    bundleType: "MULTI_EVENT",
    eventId: eventIds[0],
    eventIds,
    name: "New Year's Day Full Pass",
    description: "Celebrate the entire New Year's Day! Brunch, afternoon social, and evening dance. Save $25!",
    price: 8500, // $85 (saves $25 from $110)
    savings: 2500,
    includedTiers: [
      { tierId: tierMap.morningGA, tierName: "General Admission", quantity: 1, eventId: morning, eventName: "Recovery Brunch" },
      { tierId: tierMap.afternoonGA, tierName: "General Admission", quantity: 1, eventId: afternoon, eventName: "Afternoon Social" },
      { tierId: tierMap.eveningGA, tierName: "General Admission", quantity: 1, eventId: evening, eventName: "First Dance of the Year" },
    ],
  });

  console.log(`\n✅ New Year's Day complete: 3 events, 1 bundle\n`);
  return { eventIds, tierMap };
}

// =================================================================
// SCENARIO 6: 4th of July (Same-Day Multi-Event - VIP)
// =================================================================
async function createFourthOfJuly() {
  console.log("\n🎯 SCENARIO 6: 4th of July (Same-Day Multi-Event - VIP)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const eventIds = [];
  const tierMap = {};

  // Morning Brunch
  const morning = await createEvent({
    name: "4th of July - Independence Day Brunch",
    description: "Celebrate America's birthday with brunch and stepping!",
    startDate: new Date("2026-07-04T11:00:00").getTime(),
    endDate: new Date("2026-07-04T15:00:00").getTime(),
  });
  eventIds.push(morning);

  tierMap.morningGA = await createTicketTier(morning, {
    name: "General Admission",
    description: "Brunch GA ticket",
    price: 3500, // $35
  });

  tierMap.morningVIP = await createTicketTier(morning, {
    name: "VIP",
    description: "Brunch VIP ticket with reserved seating",
    price: 5500, // $55
  });

  await activateEvent(morning);

  // Afternoon Social
  const afternoon = await createEvent({
    name: "4th of July - Patriotic Social",
    description: "Afternoon social before the fireworks!",
    startDate: new Date("2026-07-04T17:00:00").getTime(),
    endDate: new Date("2026-07-04T20:00:00").getTime(),
  });
  eventIds.push(afternoon);

  tierMap.afternoonGA = await createTicketTier(afternoon, {
    name: "General Admission",
    description: "Social GA ticket",
    price: 3000, // $30
  });

  tierMap.afternoonVIP = await createTicketTier(afternoon, {
    name: "VIP",
    description: "Social VIP ticket with reserved seating",
    price: 5000, // $50
  });

  await activateEvent(afternoon);

  // Evening Dance Party
  const evening = await createEvent({
    name: "4th of July - Fireworks Dance Party",
    description: "Dance under the fireworks! The biggest 4th of July party!",
    startDate: new Date("2026-07-04T21:00:00").getTime(),
    endDate: new Date("2026-07-05T01:00:00").getTime(),
  });
  eventIds.push(evening);

  tierMap.eveningGA = await createTicketTier(evening, {
    name: "General Admission",
    description: "Evening party GA ticket",
    price: 4000, // $40
  });

  tierMap.eveningVIP = await createTicketTier(evening, {
    name: "VIP",
    description: "Evening party VIP ticket with reserved seating",
    price: 6500, // $65
  });

  await activateEvent(evening);

  // Create VIP All-American Bundle
  await createBundle({
    bundleType: "MULTI_EVENT",
    eventId: eventIds[0],
    eventIds,
    name: "All-American VIP Day Pass",
    description: "VIP access all day! Brunch, afternoon social, and fireworks party. Save $35!",
    price: 13500, // $135 (saves $35 from $170)
    savings: 3500,
    includedTiers: [
      { tierId: tierMap.morningVIP, tierName: "VIP", quantity: 1, eventId: morning, eventName: "Independence Day Brunch" },
      { tierId: tierMap.afternoonVIP, tierName: "VIP", quantity: 1, eventId: afternoon, eventName: "Patriotic Social" },
      { tierId: tierMap.eveningVIP, tierName: "VIP", quantity: 1, eventId: evening, eventName: "Fireworks Dance Party" },
    ],
  });

  console.log(`\n✅ 4th of July complete: 3 events, 1 bundle\n`);
  return { eventIds, tierMap };
}

// =================================================================
// SCENARIO 7: Spring Training Weekend (Complex - Multiple Bundles)
// =================================================================
async function createSpringTraining() {
  console.log("\n🎯 SCENARIO 7: Spring Training Weekend (Complex Multi-Bundle)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const eventIds = [];
  const tierMap = {};

  // Friday Evening Workshop
  const friday = await createEvent({
    name: "Spring Training - Friday Evening Workshop",
    description: "Friday evening technique workshop for all levels!",
    startDate: new Date("2026-04-04T19:00:00").getTime(),
    endDate: new Date("2026-04-04T22:00:00").getTime(),
  });
  eventIds.push(friday);

  tierMap.fridayBeginner = await createTicketTier(friday, {
    name: "Beginner",
    description: "Beginner level workshop",
    price: 3000, // $30
  });

  tierMap.fridayAdvanced = await createTicketTier(friday, {
    name: "Advanced",
    description: "Advanced level workshop",
    price: 4500, // $45
  });

  await activateEvent(friday);

  // Saturday Morning Technique
  const saturdayAM = await createEvent({
    name: "Spring Training - Saturday Morning Technique Class",
    description: "Saturday morning intensive technique class!",
    startDate: new Date("2026-04-05T10:00:00").getTime(),
    endDate: new Date("2026-04-05T13:00:00").getTime(),
  });
  eventIds.push(saturdayAM);

  tierMap.satAMBeginner = await createTicketTier(saturdayAM, {
    name: "Beginner",
    description: "Beginner level class",
    price: 3500, // $35
  });

  tierMap.satAMAdvanced = await createTicketTier(saturdayAM, {
    name: "Advanced",
    description: "Advanced level class",
    price: 5000, // $50
  });

  await activateEvent(saturdayAM);

  // Saturday Night Practice Social
  const saturdayPM = await createEvent({
    name: "Spring Training - Saturday Night Practice Social",
    description: "Put your new skills to practice!",
    startDate: new Date("2026-04-05T20:00:00").getTime(),
    endDate: new Date("2026-04-06T00:00:00").getTime(),
  });
  eventIds.push(saturdayPM);

  tierMap.satPMGA = await createTicketTier(saturdayPM, {
    name: "General Admission",
    description: "Practice social GA ticket",
    price: 2500, // $25
  });

  tierMap.satPMVIP = await createTicketTier(saturdayPM, {
    name: "VIP",
    description: "Practice social VIP ticket",
    price: 4000, // $40
  });

  await activateEvent(saturdayPM);

  // Sunday Competition Prep
  const sunday = await createEvent({
    name: "Spring Training - Sunday Competition Prep",
    description: "Sunday competition preparation workshop!",
    startDate: new Date("2026-04-06T14:00:00").getTime(),
    endDate: new Date("2026-04-06T18:00:00").getTime(),
  });
  eventIds.push(sunday);

  tierMap.sundayBeginner = await createTicketTier(sunday, {
    name: "Beginner",
    description: "Beginner level prep",
    price: 3000, // $30
  });

  tierMap.sundayAdvanced = await createTicketTier(sunday, {
    name: "Advanced",
    description: "Advanced level prep",
    price: 4500, // $45
  });

  await activateEvent(sunday);

  // Create Beginner Bundle
  await createBundle({
    bundleType: "MULTI_EVENT",
    eventId: eventIds[0],
    eventIds,
    name: "Weekend Warrior Package",
    description: "Complete beginner training package! All 4 events at beginner/GA level. Save $25!",
    price: 9500, // $95 (saves $25 from $120)
    savings: 2500,
    includedTiers: [
      { tierId: tierMap.fridayBeginner, tierName: "Beginner", quantity: 1, eventId: friday, eventName: "Friday Evening Workshop" },
      { tierId: tierMap.satAMBeginner, tierName: "Beginner", quantity: 1, eventId: saturdayAM, eventName: "Saturday Morning Technique" },
      { tierId: tierMap.satPMGA, tierName: "General Admission", quantity: 1, eventId: saturdayPM, eventName: "Saturday Night Practice" },
      { tierId: tierMap.sundayBeginner, tierName: "Beginner", quantity: 1, eventId: sunday, eventName: "Sunday Competition Prep" },
    ],
  });

  // Create Advanced Bundle
  await createBundle({
    bundleType: "MULTI_EVENT",
    eventId: eventIds[0],
    eventIds,
    name: "Advanced Training Package",
    description: "Elite training package! All 4 events at advanced/VIP level. Save $40!",
    price: 14000, // $140 (saves $40 from $180)
    savings: 4000,
    includedTiers: [
      { tierId: tierMap.fridayAdvanced, tierName: "Advanced", quantity: 1, eventId: friday, eventName: "Friday Evening Workshop" },
      { tierId: tierMap.satAMAdvanced, tierName: "Advanced", quantity: 1, eventId: saturdayAM, eventName: "Saturday Morning Technique" },
      { tierId: tierMap.satPMVIP, tierName: "VIP", quantity: 1, eventId: saturdayPM, eventName: "Saturday Night Practice" },
      { tierId: tierMap.sundayAdvanced, tierName: "Advanced", quantity: 1, eventId: sunday, eventName: "Sunday Competition Prep" },
    ],
  });

  console.log(`\n✅ Spring Training complete: 4 events, 2 bundles\n`);
  return { eventIds, tierMap };
}

// =================================================================
// SCENARIO 8: Summer Social Series (Complex - Mixed Tiers)
// =================================================================
async function createSummerSeries() {
  console.log("\n🎯 SCENARIO 8: Summer Social Series (Complex - Mixed Tiers)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const eventIds = [];
  const tierMap = {};

  // Friday Rooftop Social
  const friday = await createEvent({
    name: "Summer Series - Friday Rooftop Social",
    description: "Friday night under the stars on the rooftop!",
    startDate: new Date("2026-07-11T20:00:00").getTime(),
    endDate: new Date("2026-07-11T23:00:00").getTime(),
  });
  eventIds.push(friday);

  tierMap.fridayGA = await createTicketTier(friday, {
    name: "General Admission",
    description: "Friday rooftop GA",
    price: 3000, // $30
  });

  tierMap.fridayVIP = await createTicketTier(friday, {
    name: "VIP",
    description: "Friday rooftop VIP with reserved area",
    price: 5000, // $50
  });

  await activateEvent(friday);

  // Saturday Morning Brunch
  const saturdayAM = await createEvent({
    name: "Summer Series - Saturday Brunch Social",
    description: "Saturday brunch and light stepping!",
    startDate: new Date("2026-07-12T11:00:00").getTime(),
    endDate: new Date("2026-07-12T14:00:00").getTime(),
  });
  eventIds.push(saturdayAM);

  tierMap.satAMGA = await createTicketTier(saturdayAM, {
    name: "General Admission",
    description: "Brunch GA ticket",
    price: 2500, // $25
  });

  tierMap.satAMVIP = await createTicketTier(saturdayAM, {
    name: "VIP",
    description: "Brunch VIP ticket with reserved seating",
    price: 4000, // $40
  });

  await activateEvent(saturdayAM);

  // Saturday Night Glow Party
  const saturdayPM = await createEvent({
    name: "Summer Series - Saturday Glow Party",
    description: "Saturday night glow-in-the-dark stepping party!",
    startDate: new Date("2026-07-12T21:00:00").getTime(),
    endDate: new Date("2026-07-13T01:00:00").getTime(),
  });
  eventIds.push(saturdayPM);

  tierMap.satPMGA = await createTicketTier(saturdayPM, {
    name: "General Admission",
    description: "Glow party GA ticket",
    price: 4000, // $40
  });

  tierMap.satPMVIP = await createTicketTier(saturdayPM, {
    name: "VIP",
    description: "Glow party VIP ticket",
    price: 6000, // $60
  });

  await activateEvent(saturdayPM);

  // Sunday Afternoon Cookout
  const sunday = await createEvent({
    name: "Summer Series - Sunday Farewell Cookout",
    description: "Sunday afternoon cookout and stepping!",
    startDate: new Date("2026-07-13T15:00:00").getTime(),
    endDate: new Date("2026-07-13T19:00:00").getTime(),
  });
  eventIds.push(sunday);

  tierMap.sundayGA = await createTicketTier(sunday, {
    name: "General Admission",
    description: "Cookout GA ticket",
    price: 2000, // $20
  });

  tierMap.sundayVIP = await createTicketTier(sunday, {
    name: "VIP",
    description: "Cookout VIP ticket with reserved area",
    price: 3500, // $35
  });

  await activateEvent(sunday);

  // Create Mixed Bundle (2 GA + 2 VIP)
  await createBundle({
    bundleType: "MULTI_EVENT",
    eventId: eventIds[0],
    eventIds,
    name: "Summer Lover's Pass",
    description: "The perfect summer weekend! Mixed GA and VIP tickets (Friday GA, Saturday Brunch VIP, Saturday Glow GA, Sunday VIP). Save $35!",
    price: 11000, // $110 (saves $35 from $145: 30+40+40+35)
    savings: 3500,
    includedTiers: [
      { tierId: tierMap.fridayGA, tierName: "General Admission", quantity: 1, eventId: friday, eventName: "Friday Rooftop Social" },
      { tierId: tierMap.satAMVIP, tierName: "VIP", quantity: 1, eventId: saturdayAM, eventName: "Saturday Brunch Social" },
      { tierId: tierMap.satPMGA, tierName: "General Admission", quantity: 1, eventId: saturdayPM, eventName: "Saturday Glow Party" },
      { tierId: tierMap.sundayVIP, tierName: "VIP", quantity: 1, eventId: sunday, eventName: "Sunday Farewell Cookout" },
    ],
  });

  console.log(`\n✅ Summer Social Series complete: 4 events, 1 bundle\n`);
  return { eventIds, tierMap };
}

// =================================================================
// SCENARIO 9: Championship Weekend (Complex - Competitor vs Spectator)
// =================================================================
async function createChampionshipWeekend() {
  console.log("\n🎯 SCENARIO 9: Championship Weekend (Complex - Competitor vs Spectator)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const eventIds = [];
  const tierMap = {};

  // Friday Pre-Competition Workshop
  const friday = await createEvent({
    name: "Championship - Friday Pre-Competition Workshop",
    description: "Friday pre-championship workshop and strategy session!",
    startDate: new Date("2026-09-19T18:00:00").getTime(),
    endDate: new Date("2026-09-19T21:00:00").getTime(),
  });
  eventIds.push(friday);

  tierMap.fridayCompetitor = await createTicketTier(friday, {
    name: "Competitor",
    description: "Competitor workshop ticket",
    price: 5000, // $50
  });

  tierMap.fridaySpectator = await createTicketTier(friday, {
    name: "Spectator",
    description: "Spectator workshop viewing ticket",
    price: 2500, // $25
  });

  await activateEvent(friday);

  // Saturday Preliminaries
  const saturdayAM = await createEvent({
    name: "Championship - Saturday Preliminaries",
    description: "Saturday preliminary rounds!",
    startDate: new Date("2026-09-20T14:00:00").getTime(),
    endDate: new Date("2026-09-20T18:00:00").getTime(),
  });
  eventIds.push(saturdayAM);

  tierMap.satAMCompetitor = await createTicketTier(saturdayAM, {
    name: "Competitor",
    description: "Competitor entry fee",
    price: 7500, // $75
  });

  tierMap.satAMSpectator = await createTicketTier(saturdayAM, {
    name: "Spectator",
    description: "Spectator viewing ticket",
    price: 3500, // $35
  });

  await activateEvent(saturdayAM);

  // Saturday Finals & Dance Party
  const saturdayPM = await createEvent({
    name: "Championship - Saturday Finals & Dance Party",
    description: "Championship finals and celebration dance!",
    startDate: new Date("2026-09-20T20:00:00").getTime(),
    endDate: new Date("2026-09-21T01:00:00").getTime(),
  });
  eventIds.push(saturdayPM);

  tierMap.satPMCompetitor = await createTicketTier(saturdayPM, {
    name: "Competitor",
    description: "Competitor finals entry",
    price: 10000, // $100
  });

  tierMap.satPMSpectator = await createTicketTier(saturdayPM, {
    name: "Spectator",
    description: "Spectator viewing and dance ticket",
    price: 5000, // $50
  });

  await activateEvent(saturdayPM);

  // Sunday Awards Brunch
  const sunday = await createEvent({
    name: "Championship - Sunday Awards Brunch",
    description: "Sunday awards brunch for all!",
    startDate: new Date("2026-09-21T12:00:00").getTime(),
    endDate: new Date("2026-09-21T16:00:00").getTime(),
  });
  eventIds.push(sunday);

  tierMap.sundayAll = await createTicketTier(sunday, {
    name: "All Access",
    description: "Awards brunch ticket for everyone",
    price: 4000, // $40
  });

  await activateEvent(sunday);

  // Create Competitor Full Access Bundle
  await createBundle({
    bundleType: "MULTI_EVENT",
    eventId: eventIds[0],
    eventIds,
    name: "Competitor Full Access Pass",
    description: "Complete competitor package! Workshop, preliminaries, finals, and awards brunch. Save $40!",
    price: 22500, // $225 (saves $40 from $265)
    savings: 4000,
    includedTiers: [
      { tierId: tierMap.fridayCompetitor, tierName: "Competitor", quantity: 1, eventId: friday, eventName: "Pre-Competition Workshop" },
      { tierId: tierMap.satAMCompetitor, tierName: "Competitor", quantity: 1, eventId: saturdayAM, eventName: "Preliminaries" },
      { tierId: tierMap.satPMCompetitor, tierName: "Competitor", quantity: 1, eventId: saturdayPM, eventName: "Finals & Dance Party" },
      { tierId: tierMap.sundayAll, tierName: "All Access", quantity: 1, eventId: sunday, eventName: "Awards Brunch" },
    ],
  });

  // Create Spectator Weekend Pass Bundle
  await createBundle({
    bundleType: "MULTI_EVENT",
    eventId: eventIds[0],
    eventIds,
    name: "Spectator Weekend Pass",
    description: "Complete spectator package! Watch all the action from Friday through Sunday. Save $30!",
    price: 12000, // $120 (saves $30 from $150)
    savings: 3000,
    includedTiers: [
      { tierId: tierMap.fridaySpectator, tierName: "Spectator", quantity: 1, eventId: friday, eventName: "Pre-Competition Workshop" },
      { tierId: tierMap.satAMSpectator, tierName: "Spectator", quantity: 1, eventId: saturdayAM, eventName: "Preliminaries" },
      { tierId: tierMap.satPMSpectator, tierName: "Spectator", quantity: 1, eventId: saturdayPM, eventName: "Finals & Dance Party" },
      { tierId: tierMap.sundayAll, tierName: "All Access", quantity: 1, eventId: sunday, eventName: "Awards Brunch" },
    ],
  });

  console.log(`\n✅ Championship Weekend complete: 4 events, 2 bundles\n`);
  return { eventIds, tierMap };
}

// =================================================================
// MAIN EXECUTION
// =================================================================
async function main() {
  try {
    console.log("Starting comprehensive bundle test creation...\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const results = {
      totalEvents: 0,
      totalBundles: 0,
      scenarios: [],
    };

    // Create all scenarios
    await createMemorialDayWeekend();
    results.totalEvents += 3;
    results.totalBundles += 1;

    await createLaborDayWeekend();
    results.totalEvents += 3;
    results.totalBundles += 1;

    await createJuneteenthWeekend();
    results.totalEvents += 3;
    results.totalBundles += 1;

    await createValentinesDay();
    results.totalEvents += 3;
    results.totalBundles += 1;

    await createNewYearsDay();
    results.totalEvents += 3;
    results.totalBundles += 1;

    await createFourthOfJuly();
    results.totalEvents += 3;
    results.totalBundles += 1;

    await createSpringTraining();
    results.totalEvents += 4;
    results.totalBundles += 2;

    await createSummerSeries();
    results.totalEvents += 4;
    results.totalBundles += 1;

    await createChampionshipWeekend();
    results.totalEvents += 4;
    results.totalBundles += 2;

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("🔄 Activating all events and payment configurations...\n");

    // Activate all tickets using the global activation mutation
    const activationResult = await client.mutation(api.activateAllTickets.activateAllTickets);
    console.log(`✅ Activation complete!`);
    console.log(`   • ${activationResult.eventsUpdated} events activated`);
    console.log(`   • ${activationResult.paymentConfigsCreated} payment configs created`);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("🎉 SUCCESS! All bundle test scenarios created!\n");
    console.log(`📊 SUMMARY:`);
    console.log(`   • ${results.totalEvents} events created`);
    console.log(`   • ${results.totalBundles} bundles created`);
    console.log(`   • All events activated with ticketsVisible=true`);
    console.log(`   • All payment configs created (CREDIT_CARD model)`);
    console.log(`\n📍 TEST YOUR BUNDLES:`);
    console.log(`   • Browse all bundles: http://localhost:3004/bundles`);
    console.log(`   • Browse events: http://localhost:3004`);
    console.log(`\n✅ All events are live with payment configs!`);
    console.log(`✅ All bundles are active and ready to purchase!`);
    console.log(`\n🧪 Ready for live testing!\n`);

  } catch (error) {
    console.error("\n💥 Error:", error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

main();
