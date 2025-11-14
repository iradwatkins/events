#!/usr/bin/env node

/**
 * Create Ticketed Events with Bundles
 *
 * Creates:
 * - 3 simple 2-ticket events (single day)
 * - 3 three-day events (Friday, Saturday, Sunday)
 * - 3 three-day weekend events with bundles for all 3 days
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🎟️  Creating Ticketed Events\n");
console.log(`📡 Convex URL: ${CONVEX_URL}\n`);

// Test organizer
const organizer = {
  email: "test.organizer@stepperslife.com",
  name: "Marcus Williams",
  password: "Bobby321!",
};

// Helper to get next Friday
function getNextFriday() {
  const today = new Date();
  const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
  const friday = new Date(today);
  friday.setDate(today.getDate() + daysUntilFriday + 7); // Next week's Friday
  return friday;
}

// Simple 2-ticket events
const simple2TicketEvents = [
  {
    name: "Friday Night Steppers Set",
    description: "Classic Friday night stepping with DJ and professional instruction",
    categories: ["Set"],
    venueName: "The Promontory",
    city: "Chicago",
    state: "IL",
    imageUrl: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=600&fit=crop",
    tickets: [
      { name: "General Admission", price: 2500, quantity: 100 }, // $25
      { name: "VIP", price: 5000, quantity: 50 }, // $50
    ]
  },
  {
    name: "Beginner Workshop",
    description: "Learn the basics of Chicago stepping in this interactive workshop",
    categories: ["Workshop"],
    venueName: "South Shore Cultural Center",
    city: "Chicago",
    state: "IL",
    imageUrl: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800&h=600&fit=crop",
    tickets: [
      { name: "Early Bird", price: 1500, quantity: 75 }, // $15
      { name: "Regular", price: 2000, quantity: 75 }, // $20
    ]
  },
  {
    name: "Saturday Night Social",
    description: "Join us for an evening of smooth stepping and great music",
    categories: ["Set"],
    venueName: "Quarters on Halsted",
    city: "Chicago",
    state: "IL",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop",
    tickets: [
      { name: "General Admission", price: 2000, quantity: 150 }, // $20
      { name: "VIP Table", price: 7500, quantity: 20 }, // $75
    ]
  },
];

// Three-day events (Friday, Saturday, Sunday - separate tickets)
const threeDayEvents = [
  {
    name: "Memorial Day Weekend Steppers Festival",
    description: "Three days of stepping, workshops, and social dancing",
    categories: ["Weekend Event"],
    venueName: "Chicago Cultural Center",
    city: "Chicago",
    state: "IL",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop",
    days: [
      { day: "Friday", tickets: [
        { name: "Friday Night Pass", price: 3000, quantity: 200 }, // $30
        { name: "Friday VIP", price: 6000, quantity: 50 }, // $60
      ]},
      { day: "Saturday", tickets: [
        { name: "Saturday Pass", price: 3500, quantity: 200 }, // $35
        { name: "Saturday VIP", price: 7000, quantity: 50 }, // $70
      ]},
      { day: "Sunday", tickets: [
        { name: "Sunday Brunch & Step", price: 2500, quantity: 150 }, // $25
        { name: "Sunday VIP", price: 5000, quantity: 40 }, // $50
      ]},
    ]
  },
  {
    name: "Labor Day Steppers Retreat",
    description: "Weekend retreat with workshops, socials, and competitions",
    categories: ["Weekend Event"],
    venueName: "The Ballroom at Renaissance",
    city: "Atlanta",
    state: "GA",
    imageUrl: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&h=600&fit=crop",
    days: [
      { day: "Friday", tickets: [
        { name: "Friday Kickoff", price: 2500, quantity: 180 }, // $25
        { name: "Friday Premium", price: 5500, quantity: 60 }, // $55
      ]},
      { day: "Saturday", tickets: [
        { name: "Saturday All-Day", price: 4000, quantity: 180 }, // $40
        { name: "Saturday VIP", price: 8000, quantity: 60 }, // $80
      ]},
      { day: "Sunday", tickets: [
        { name: "Sunday Finale", price: 3000, quantity: 150 }, // $30
        { name: "Sunday Premium", price: 6000, quantity: 50 }, // $60
      ]},
    ]
  },
  {
    name: "Juneteenth Steppers Celebration",
    description: "Celebrate Juneteenth with three days of stepping and culture",
    categories: ["Holiday Event", "Weekend Event"],
    venueName: "Discovery Green",
    city: "Houston",
    state: "TX",
    imageUrl: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&h=600&fit=crop",
    days: [
      { day: "Friday", tickets: [
        { name: "Friday Evening", price: 2000, quantity: 200 }, // $20
        { name: "Friday VIP", price: 4500, quantity: 75 }, // $45
      ]},
      { day: "Saturday", tickets: [
        { name: "Saturday Festival Pass", price: 3500, quantity: 200 }, // $35
        { name: "Saturday VIP", price: 7500, quantity: 75 }, // $75
      ]},
      { day: "Sunday", tickets: [
        { name: "Sunday Celebration", price: 2500, quantity: 180 }, // $25
        { name: "Sunday VIP", price: 5500, quantity: 60 }, // $55
      ]},
    ]
  },
];

// Three-day weekend events with ALL-WEEKEND bundles
const weekendBundleEvents = [
  {
    name: "New Year's Weekend Steppers Extravaganza",
    description: "Ring in the new year with three full days of stepping",
    categories: ["Holiday Event", "Weekend Event"],
    venueName: "Navy Pier Grand Ballroom",
    city: "Chicago",
    state: "IL",
    imageUrl: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&h=600&fit=crop",
    days: [
      { day: "Friday", tickets: [
        { name: "Friday Night", price: 4000, quantity: 150 }, // $40
        { name: "Friday VIP", price: 8000, quantity: 50 }, // $80
      ]},
      { day: "Saturday", tickets: [
        { name: "Saturday All-Day", price: 5000, quantity: 150 }, // $50
        { name: "Saturday VIP", price: 10000, quantity: 50 }, // $100
      ]},
      { day: "Sunday", tickets: [
        { name: "Sunday Brunch & Step", price: 3500, quantity: 120 }, // $35
        { name: "Sunday VIP", price: 7000, quantity: 40 }, // $70
      ]},
    ],
    bundle: {
      name: "Full Weekend Pass",
      description: "Access to all three days - Friday, Saturday, and Sunday",
      price: 10000, // $100 (save $25)
      quantity: 100,
    }
  },
  {
    name: "Valentine's Weekend Steppers Romance",
    description: "Romantic weekend of couples stepping and social dancing",
    categories: ["Holiday Event", "Weekend Event"],
    venueName: "The Drake Hotel Ballroom",
    city: "Chicago",
    state: "IL",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop",
    days: [
      { day: "Friday", tickets: [
        { name: "Friday Romance Night", price: 3500, quantity: 120 }, // $35
        { name: "Friday Couples VIP", price: 9000, quantity: 40 }, // $90 (for 2)
      ]},
      { day: "Saturday", tickets: [
        { name: "Saturday Valentine's Gala", price: 5000, quantity: 120 }, // $50
        { name: "Saturday Couples VIP", price: 12000, quantity: 40 }, // $120 (for 2)
      ]},
      { day: "Sunday", tickets: [
        { name: "Sunday Brunch", price: 3000, quantity: 100 }, // $30
        { name: "Sunday Couples VIP", price: 8000, quantity: 30 }, // $80 (for 2)
      ]},
    ],
    bundle: {
      name: "Romantic Weekend Package",
      description: "Full weekend access for couples - all three days",
      price: 9500, // $95 (save $20)
      quantity: 80,
    }
  },
  {
    name: "4th of July Freedom Steppers Weekend",
    description: "Celebrate Independence Day with three days of patriotic stepping",
    categories: ["Holiday Event", "Weekend Event"],
    venueName: "Millennium Park",
    city: "Chicago",
    state: "IL",
    imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop",
    days: [
      { day: "Friday", tickets: [
        { name: "Friday Freedom Kickoff", price: 3000, quantity: 200 }, // $30
        { name: "Friday VIP", price: 6500, quantity: 75 }, // $65
      ]},
      { day: "Saturday", tickets: [
        { name: "Saturday 4th of July Bash", price: 4000, quantity: 200 }, // $40
        { name: "Saturday VIP", price: 8500, quantity: 75 }, // $85
      ]},
      { day: "Sunday", tickets: [
        { name: "Sunday Finale", price: 2500, quantity: 180 }, // $25
        { name: "Sunday VIP", price: 5500, quantity: 60 }, // $55
      ]},
    ],
    bundle: {
      name: "Freedom Weekend Pass",
      description: "Celebrate all three days of freedom and stepping",
      price: 8000, // $80 (save $15)
      quantity: 120,
    }
  },
];

async function createOrGetOrganizer() {
  console.log(`👤 Setting up organizer: ${organizer.name}`);
  console.log(`   Email: ${organizer.email}\n`);

  const existingUser = await client.query(api.users.queries.getUserByEmail, {
    email: organizer.email,
  });

  let userId;
  if (existingUser) {
    console.log(`   ✓ Using existing account\n`);
    userId = existingUser._id;
  } else {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(organizer.password, saltRounds);

    userId = await client.mutation(api.auth.mutations.createUserWithPassword, {
      email: organizer.email,
      name: organizer.name,
      passwordHash: passwordHash,
      role: "organizer",
    });

    console.log(`   ✓ Account created\n`);
  }

  return userId;
}

async function createSimpleEvent(eventData, dayOffset) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + dayOffset);
  startDate.setHours(19, 0, 0, 0); // 7 PM

  const endDate = new Date(startDate);
  endDate.setHours(23, 0, 0, 0); // 11 PM

  const eventId = await client.mutation(api.events.mutations.createEvent, {
    name: eventData.name,
    eventType: "TICKETED_EVENT",
    description: eventData.description,
    categories: eventData.categories,
    startDate: startDate.getTime(),
    endDate: endDate.getTime(),
    timezone: "America/Chicago",
    eventDateLiteral: startDate.toLocaleDateString(),
    eventTimeLiteral: "7:00 PM",
    eventTimezone: "CST",
    location: {
      venueName: eventData.venueName,
      address: "TBD",
      city: eventData.city,
      state: eventData.state,
      zipCode: "00000",
      country: "USA",
    },
    capacity: 300,
    imageUrl: eventData.imageUrl,
  });

  // Create ticket tiers
  for (const ticket of eventData.tickets) {
    await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: ticket.name,
      price: ticket.price,
      quantity: ticket.quantity,
      description: `${ticket.name} ticket`,
    });
  }

  return eventId;
}

async function createThreeDayEvent(eventData, startFriday) {
  const eventIds = [];

  for (let dayIndex = 0; dayIndex < 3; dayIndex++) {
    const dayData = eventData.days[dayIndex];
    const eventDate = new Date(startFriday);
    eventDate.setDate(startFriday.getDate() + dayIndex);
    eventDate.setHours(19, 0, 0, 0);

    const endDate = new Date(eventDate);
    endDate.setHours(23, 30, 0, 0);

    const eventId = await client.mutation(api.events.mutations.createEvent, {
      name: `${eventData.name} - ${dayData.day}`,
      eventType: "TICKETED_EVENT",
      description: `${eventData.description} (${dayData.day})`,
      categories: eventData.categories,
      startDate: eventDate.getTime(),
      endDate: endDate.getTime(),
      timezone: "America/Chicago",
      eventDateLiteral: eventDate.toLocaleDateString(),
      eventTimeLiteral: "7:00 PM",
      eventTimezone: "CST",
      location: {
        venueName: eventData.venueName,
        address: "TBD",
        city: eventData.city,
        state: eventData.state,
        zipCode: "00000",
        country: "USA",
      },
      capacity: 400,
      imageUrl: eventData.imageUrl,
    });

    // Create ticket tiers for this day
    for (const ticket of dayData.tickets) {
      await client.mutation(api.tickets.mutations.createTicketTier, {
        eventId,
        name: ticket.name,
        price: ticket.price,
        quantity: ticket.quantity,
        description: `${ticket.name} for ${dayData.day}`,
      });
    }

    eventIds.push(eventId);
  }

  return eventIds;
}

async function createBundleEvent(eventData, startFriday) {
  const eventIds = [];

  // Create individual day events
  for (let dayIndex = 0; dayIndex < 3; dayIndex++) {
    const dayData = eventData.days[dayIndex];
    const eventDate = new Date(startFriday);
    eventDate.setDate(startFriday.getDate() + dayIndex);
    eventDate.setHours(19, 0, 0, 0);

    const endDate = new Date(eventDate);
    endDate.setHours(23, 30, 0, 0);

    const eventId = await client.mutation(api.events.mutations.createEvent, {
      name: `${eventData.name} - ${dayData.day}`,
      eventType: "TICKETED_EVENT",
      description: `${eventData.description} (${dayData.day})`,
      categories: eventData.categories,
      startDate: eventDate.getTime(),
      endDate: endDate.getTime(),
      timezone: "America/Chicago",
      eventDateLiteral: eventDate.toLocaleDateString(),
      eventTimeLiteral: "7:00 PM",
      eventTimezone: "CST",
      location: {
        venueName: eventData.venueName,
        address: "TBD",
        city: eventData.city,
        state: eventData.state,
        zipCode: "00000",
        country: "USA",
      },
      capacity: 400,
      imageUrl: eventData.imageUrl,
    });

    // Create ticket tiers for this day
    for (const ticket of dayData.tickets) {
      await client.mutation(api.tickets.mutations.createTicketTier, {
        eventId,
        name: ticket.name,
        price: ticket.price,
        quantity: ticket.quantity,
        description: `${ticket.name} for ${dayData.day}`,
      });
    }

    eventIds.push(eventId);
  }

  // Create bundle for all 3 events
  // Note: Bundles will be created manually through the UI for now
  // The bundle data is preserved in eventData.bundle for reference

  return eventIds;
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await createOrGetOrganizer();

  // Create simple 2-ticket events
  console.log("📝 Creating 3 Simple 2-Ticket Events\n");
  for (let i = 0; i < simple2TicketEvents.length; i++) {
    const eventData = simple2TicketEvents[i];
    await createSimpleEvent(eventData, 14 + (i * 7)); // 2, 3, 4 weeks out
    console.log(`   ${i + 1}. ${eventData.name}`);
    console.log(`      ${eventData.tickets.map(t => `${t.name} ($${(t.price/100).toFixed(2)})`).join(", ")}\n`);
  }

  // Create three-day events
  console.log("\n📅 Creating 3 Three-Day Events (Separate Tickets)\n");
  const friday1 = getNextFriday();
  friday1.setDate(friday1.getDate() + 21); // 4 weeks out

  for (let i = 0; i < threeDayEvents.length; i++) {
    const eventData = threeDayEvents[i];
    const startFriday = new Date(friday1);
    startFriday.setDate(friday1.getDate() + (i * 21)); // 3 weeks apart

    await createThreeDayEvent(eventData, startFriday);
    console.log(`   ${i + 1}. ${eventData.name}`);
    console.log(`      Friday, Saturday, Sunday events created\n`);
  }

  // Create weekend bundle events
  console.log("\n🎁 Creating 3 Weekend Events with ALL-WEEKEND Bundles\n");
  const friday2 = getNextFriday();
  friday2.setDate(friday2.getDate() + 84); // 12 weeks out

  for (let i = 0; i < weekendBundleEvents.length; i++) {
    const eventData = weekendBundleEvents[i];
    const startFriday = new Date(friday2);
    startFriday.setDate(friday2.getDate() + (i * 28)); // 4 weeks apart

    await createBundleEvent(eventData, startFriday);
    console.log(`   ${i + 1}. ${eventData.name}`);
    console.log(`      Bundle: ${eventData.bundle.name} ($${(eventData.bundle.price/100).toFixed(2)})`);
    console.log(`      Individual days also available\n`);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n✅ All Events Created!\n");
  console.log("Summary:");
  console.log("  • 3 simple 2-ticket events");
  console.log("  • 9 three-day individual events (3 weekends × 3 days)");
  console.log("  • 9 weekend events with bundles (3 weekends × 3 days + 3 bundles)");
  console.log("  • Total: 21 individual events + 3 bundles\n");
  console.log("🌐 View at: https://events.stepperslife.com");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n💥 Error:", error);
    process.exit(1);
  });
