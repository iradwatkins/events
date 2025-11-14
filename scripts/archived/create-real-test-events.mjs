#!/usr/bin/env node

/**
 * Create REAL Test Events - Using ONLY Real Categories
 * Categories: Set, Workshop, Save the Date, Cruise, Outdoors Steppin, Holiday Event, Weekend Event
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🎯 Creating REAL Test Events\n");
console.log(`📡 Convex URL: ${CONVEX_URL}\n`);

// Real organizers
const organizers = [
  {
    email: "test.organizer1@stepperslife.com",
    name: "Marcus Williams",
    password: "Bobby321!",
  },
  {
    email: "test.organizer2@stepperslife.com",
    name: "Keisha Thompson",
    password: "Bobby321!",
  },
  {
    email: "test.organizer3@stepperslife.com",
    name: "David Martinez",
    password: "Bobby321!",
  },
];

// Real events using ONLY the specified categories
const events = [
  // Organizer 1
  [
    {
      name: "Chicago Steppers Set at The Promontory",
      eventType: "SAVE_THE_DATE",
      description: "Join us for a classic Chicago stepping set with live DJ and professional instruction.",
      categories: ["Set"],
      city: "Chicago",
      state: "IL",
      venueName: "The Promontory",
      imageUrl: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=600&fit=crop",
    },
    {
      name: "Beginner Stepping Workshop",
      eventType: "FREE_EVENT",
      description: "Free workshop for beginners learning Chicago stepping basics. All levels welcome.",
      categories: ["Workshop"],
      city: "Chicago",
      state: "IL",
      venueName: "South Shore Cultural Center",
      imageUrl: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800&h=600&fit=crop",
    },
    {
      name: "Memorial Day Weekend Steppers Social",
      eventType: "SAVE_THE_DATE",
      description: "Three-day weekend celebration of stepping with multiple sets and social events.",
      categories: ["Weekend Event"],
      city: "Chicago",
      state: "IL",
      venueName: "Quarters on Halsted",
      imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop",
    },
  ],

  // Organizer 2
  [
    {
      name: "New Year's Eve Steppers Ball",
      eventType: "SAVE_THE_DATE",
      description: "Ring in the new year with Chicago's finest steppers. Champagne toast at midnight.",
      categories: ["Holiday Event"],
      city: "Atlanta",
      state: "GA",
      venueName: "The Ballroom at Renaissance",
      imageUrl: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&h=600&fit=crop",
    },
    {
      name: "Advanced Stepping Techniques Workshop",
      eventType: "FREE_EVENT",
      description: "Master advanced stepping moves and turns. Intermediate and advanced steppers only.",
      categories: ["Workshop"],
      city: "Atlanta",
      state: "GA",
      venueName: "Southwest Arts Center",
      imageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=600&fit=crop",
    },
    {
      name: "Caribbean Steppers Cruise 2026",
      eventType: "SAVE_THE_DATE",
      description: "7-day Caribbean stepping cruise with workshops, sets, and island excursions.",
      categories: ["Cruise"],
      city: "Miami",
      state: "FL",
      venueName: "Port of Miami",
      imageUrl: "https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=800&h=600&fit=crop",
    },
  ],

  // Organizer 3
  [
    {
      name: "Summer Outdoor Steppers Festival",
      eventType: "FREE_EVENT",
      description: "Free outdoor stepping event with food trucks, live music, and dance floor under the stars.",
      categories: ["Outdoors Steppin"],
      city: "Houston",
      state: "TX",
      venueName: "Discovery Green",
      imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop",
    },
    {
      name: "Juneteenth Steppers Celebration",
      eventType: "SAVE_THE_DATE",
      description: "Celebrate Juneteenth with Chicago stepping, live band, and cultural performances.",
      categories: ["Holiday Event"],
      city: "Houston",
      state: "TX",
      venueName: "Emancipation Park",
      imageUrl: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&h=600&fit=crop",
    },
    {
      name: "Saturday Night Steppers Set",
      eventType: "SAVE_THE_DATE",
      description: "Classic Saturday night stepping set with DJ Smooth and guest instructors.",
      categories: ["Set"],
      city: "Houston",
      state: "TX",
      venueName: "The Rustic Houston",
      imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop",
    },
  ],
];

async function createAccount(organizer, index) {
  try {
    console.log(`\n👤 Organizer ${index + 1}/3: ${organizer.name}`);
    console.log(`   Email: ${organizer.email}`);

    const existingUser = await client.query(api.users.queries.getUserByEmail, {
      email: organizer.email,
    });

    let userId;
    if (existingUser) {
      console.log(`   ✓ Using existing account`);
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

      console.log(`   ✓ Account created`);
    }

    const organizerEvents = events[index];
    console.log(`\n   Creating ${organizerEvents.length} events:\n`);

    for (let i = 0; i < organizerEvents.length; i++) {
      const event = organizerEvents[i];

      const daysInFuture = 30 + (i * 20);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + daysInFuture);
      startDate.setHours(19, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(23, 0, 0, 0);

      await client.mutation(api.events.mutations.createEvent, {
        name: event.name,
        eventType: event.eventType,
        description: event.description,
        categories: event.categories,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        timezone: "America/Chicago",
        eventDateLiteral: startDate.toLocaleDateString(),
        eventTimeLiteral: "7:00 PM",
        eventTimezone: "CST",
        location: {
          venueName: event.venueName,
          address: "TBD",
          city: event.city,
          state: event.state,
          zipCode: "00000",
          country: "USA",
        },
        capacity: 150,
        imageUrl: event.imageUrl,
      });

      const typeIcon = event.eventType === "SAVE_THE_DATE" ? "📌" : "🎉";
      console.log(`   ${i + 1}. ${typeIcon} ${event.name}`);
      console.log(`      Category: ${event.categories[0]}`);
      console.log(`      ${event.description}\n`);
    }

    return { name: organizer.name, email: organizer.email };

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const created = [];

  for (let i = 0; i < organizers.length; i++) {
    const result = await createAccount(organizers[i], i);
    if (result) created.push(result);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n✅ Test Events Created\n");
  console.log("Test Accounts:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  created.forEach((account, i) => {
    console.log(`${i + 1}. ${account.name}`);
    console.log(`   📧 ${account.email}`);
    console.log(`   🔑 Password: Bobby321!\n`);
  });

  console.log("Categories Used:");
  console.log("  • Set");
  console.log("  • Workshop");
  console.log("  • Save the Date");
  console.log("  • Cruise");
  console.log("  • Outdoors Steppin");
  console.log("  • Holiday Event");
  console.log("  • Weekend Event");

  console.log("\n🌐 Test at: http://localhost:3004");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n💥 Error:", error);
    process.exit(1);
  });
