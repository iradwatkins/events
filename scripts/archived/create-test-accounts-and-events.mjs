#!/usr/bin/env node

/**
 * Create Test Accounts and Events for Registration Testing
 *
 * Creates:
 * - 3 test organizer accounts
 * - Each organizer creates 3 events (mix of save-the-date and free events)
 * - Total: 3 accounts, 9 events
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🎭 Creating Test Accounts & Events for Registration Testing\n");
console.log(`📡 Convex URL: ${CONVEX_URL}\n`);

// Test organizers
const testOrganizers = [
  {
    email: "organizer1@test.com",
    name: "Sarah Johnson",
    password: "Bobby321!",
  },
  {
    email: "organizer2@test.com",
    name: "Michael Chen",
    password: "Bobby321!",
  },
  {
    email: "organizer3@test.com",
    name: "Emily Rodriguez",
    password: "Bobby321!",
  },
];

// Event templates for each organizer with Unsplash images
const eventTemplates = [
  // Organizer 1 Events
  [
    {
      name: "Summer Music Festival 2025",
      eventType: "SAVE_THE_DATE",
      description: "Join us for an unforgettable summer music festival featuring live bands, food trucks, and family fun! Save the date for the biggest music event of the year.",
      categories: ["Music", "Festival", "Outdoor"],
      city: "Austin",
      state: "TX",
      venueName: "Zilker Park",
      imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=600&fit=crop",
    },
    {
      name: "Community Yoga in the Park",
      eventType: "FREE_EVENT",
      description: "Free community yoga session for all skill levels. Bring your mat and join us for a relaxing morning in nature. Perfect for beginners and experienced yogis alike.",
      categories: ["Wellness", "Outdoor", "Community"],
      city: "Austin",
      state: "TX",
      venueName: "Butler Park",
      imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop",
    },
    {
      name: "Tech Innovation Conference",
      eventType: "SAVE_THE_DATE",
      description: "Annual technology innovation conference featuring keynote speakers, workshops, and networking opportunities. Reserve your spot for this exclusive industry event.",
      categories: ["Technology", "Business", "Networking"],
      city: "Austin",
      state: "TX",
      venueName: "Austin Convention Center",
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
    },
  ],
  // Organizer 2 Events
  [
    {
      name: "Art Gallery Opening Night",
      eventType: "FREE_EVENT",
      description: "Celebrate the opening of our new contemporary art exhibition. Free admission includes light refreshments and the opportunity to meet the artists.",
      categories: ["Art", "Culture", "Exhibition"],
      city: "Houston",
      state: "TX",
      venueName: "Modern Arts Gallery",
      imageUrl: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800&h=600&fit=crop",
    },
    {
      name: "Annual Charity Gala 2025",
      eventType: "SAVE_THE_DATE",
      description: "Join us for our annual charity gala benefiting local children's hospitals. An elegant evening of dining, entertainment, and giving back to the community.",
      categories: ["Charity", "Gala", "Fundraiser"],
      city: "Houston",
      state: "TX",
      venueName: "The Grand Ballroom",
      imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop",
    },
    {
      name: "Weekend Food Truck Rally",
      eventType: "FREE_EVENT",
      description: "Free entry to the city's best food truck rally! Sample delicious food from 30+ vendors, enjoy live music, and family activities all weekend long.",
      categories: ["Food", "Family", "Outdoor"],
      city: "Houston",
      state: "TX",
      venueName: "Discovery Green Park",
      imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",
    },
  ],
  // Organizer 3 Events
  [
    {
      name: "New Year's Eve Bash 2025",
      eventType: "SAVE_THE_DATE",
      description: "Ring in the new year with the ultimate New Year's Eve celebration! Live DJ, premium open bar, and a spectacular midnight countdown. Limited capacity.",
      categories: ["Party", "Holiday", "Nightlife"],
      city: "Dallas",
      state: "TX",
      venueName: "Skyline Rooftop Lounge",
      imageUrl: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&h=600&fit=crop",
    },
    {
      name: "Kids STEM Workshop",
      eventType: "FREE_EVENT",
      description: "Free hands-on STEM workshop for kids ages 8-14. Learn coding, robotics, and engineering through fun interactive projects. Parents welcome!",
      categories: ["Education", "Kids", "Technology"],
      city: "Dallas",
      state: "TX",
      venueName: "Dallas Science Center",
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop",
    },
    {
      name: "Fall Wedding Expo",
      eventType: "SAVE_THE_DATE",
      description: "Save the date for the region's premier wedding planning expo. Meet vendors, see fashion shows, and get exclusive deals for your special day.",
      categories: ["Wedding", "Expo", "Planning"],
      city: "Dallas",
      state: "TX",
      venueName: "Dallas Market Hall",
      imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop",
    },
  ],
];

async function createTestAccount(organizer, index) {
  try {
    console.log(`\n👤 Creating account ${index + 1}/3: ${organizer.name}`);
    console.log(`   Email: ${organizer.email}`);

    // Check if user already exists
    const existingUser = await client.query(api.users.queries.getUserByEmail, {
      email: organizer.email,
    });

    let userId;
    if (existingUser) {
      console.log(`   ✓ User already exists, using existing account`);
      userId = existingUser._id;
    } else {
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(organizer.password, saltRounds);

      // Create user
      userId = await client.mutation(api.auth.mutations.createUserWithPassword, {
        email: organizer.email,
        name: organizer.name,
        passwordHash: passwordHash,
        role: "organizer",
      });

      console.log(`   ✓ Account created successfully`);
    }

    // Create events for this organizer
    const events = eventTemplates[index];
    console.log(`\n   📅 Creating ${events.length} events for ${organizer.name}:`);

    for (let i = 0; i < events.length; i++) {
      const template = events[i];

      // Calculate dates
      const daysInFuture = 30 + (i * 15); // Events spread out 30, 45, 60 days from now
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + daysInFuture);
      startDate.setHours(19, 0, 0, 0); // 7 PM

      const endDate = new Date(startDate);
      endDate.setHours(22, 0, 0, 0); // 10 PM

      const eventId = await client.mutation(api.events.mutations.createEvent, {
        name: template.name,
        eventType: template.eventType,
        description: template.description,
        categories: template.categories,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        timezone: "America/Chicago",
        eventDateLiteral: startDate.toLocaleDateString(),
        eventTimeLiteral: "7:00 PM",
        eventTimezone: "CST",
        location: {
          venueName: template.venueName,
          address: "123 Main Street",
          city: template.city,
          state: template.state,
          zipCode: "75001",
          country: "USA",
        },
        capacity: 200,
        imageUrl: template.imageUrl,
      });

      const eventTypeLabel = template.eventType === "SAVE_THE_DATE" ? "📌 Save the Date" : "🎉 Free Event";
      console.log(`      ${i + 1}. ${eventTypeLabel}: ${template.name}`);
      console.log(`         Date: ${startDate.toLocaleDateString()} at 7:00 PM`);
    }

    return { userId, name: organizer.name, email: organizer.email };

  } catch (error) {
    console.error(`\n   ❌ Error creating account for ${organizer.name}:`, error.message);
    return null;
  }
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const createdAccounts = [];

  for (let i = 0; i < testOrganizers.length; i++) {
    const result = await createTestAccount(testOrganizers[i], i);
    if (result) {
      createdAccounts.push(result);
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n✅ Test Data Created Successfully!\n");

  console.log("📋 Test Accounts Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  createdAccounts.forEach((account, i) => {
    console.log(`\n${i + 1}. ${account.name}`);
    console.log(`   📧 Email: ${account.email}`);
    console.log(`   🔑 Password: Bobby321!`);
    console.log(`   📅 Events: 3 (mix of save-the-date and free events)`);
  });

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🎯 Testing Instructions:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n1. Login with any of the test accounts above");
  console.log("2. View your events in the dashboard");
  console.log("3. Test registration flows for both event types:");
  console.log("   • SAVE THE DATE events - should capture interest");
  console.log("   • FREE EVENTS - should allow immediate registration");
  console.log("4. Look for any bugs or UX improvements needed");
  console.log("5. Test on both desktop and mobile");

  console.log("\n💡 What to Test:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✓ Registration form usability");
  console.log("✓ Email notifications");
  console.log("✓ Confirmation screens");
  console.log("✓ Mobile responsiveness");
  console.log("✓ Error handling");
  console.log("✓ Cancel/update registration flows");

  console.log("\n🌐 Access the site:");
  console.log("   Local: http://localhost:3004");
  console.log("   Production: https://events.stepperslife.com");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
