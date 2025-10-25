/* eslint-disable @typescript-eslint/no-require-imports */
// Script to create professional demo events
const { ConvexHttpClient } = require("convex/browser");
const fs = require("fs");

async function createDemoEvents() {
  try {
    // Read .env.local to get Convex URL
    const envContent = fs.readFileSync("/root/websites/events-stepperslife/.env.local", "utf8");
    const urlMatch = envContent.match(/NEXT_PUBLIC_CONVEX_URL=(.*)/);
    const convexUrl = urlMatch ? urlMatch[1].trim() : "https://expert-vulture-775.convex.cloud";

    console.log("🎨 Creating professional demo events...\n");
    console.log(`Convex URL: ${convexUrl}\n`);

    const client = new ConvexHttpClient(convexUrl);

    // Demo events data
    const demoEvents = [
      {
        name: "Chicago Summer Steppers Set 2025",
        description:
          "Join us for an electrifying night of Chicago Stepping! Featuring live DJ, professional dancers, and an unforgettable atmosphere. Whether you're a seasoned stepper or just learning, this event welcomes all skill levels. Dress code: Upscale casual. Come ready to dance the night away!",
        eventType: "TICKETED_EVENT",
        categories: ["Steppers Set", "Social"],
        startDate: new Date("2025-07-15T20:00:00").getTime(),
        endDate: new Date("2025-07-16T02:00:00").getTime(),
        timezone: "America/Chicago",
        location: {
          venueName: "Grand Ballroom at Navy Pier",
          address: "600 E Grand Ave",
          city: "Chicago",
          state: "IL",
          zipCode: "60611",
          country: "United States",
        },
        capacity: 500,
      },
      {
        name: "Beginner Stepping Workshop - Atlanta",
        description:
          "Perfect for beginners! Learn the fundamentals of Chicago Stepping in this comprehensive 3-hour workshop. Our experienced instructors will teach you basic steps, turns, and partner work. No dance experience required! Light refreshments provided. Bring a partner or come solo - we'll pair you up!",
        eventType: "TICKETED_EVENT",
        categories: ["Workshop", "Educational"],
        startDate: new Date("2025-06-20T14:00:00").getTime(),
        endDate: new Date("2025-06-20T17:00:00").getTime(),
        timezone: "America/New_York",
        location: {
          venueName: "Atlanta Dance Studio",
          address: "234 Peachtree St NE",
          city: "Atlanta",
          state: "GA",
          zipCode: "30303",
          country: "United States",
        },
        capacity: 50,
      },
      {
        name: "Detroit Steppers Festival 2025",
        description:
          "The Midwest's premier stepping festival returns! Three days of non-stop stepping featuring competitions, workshops, vendor marketplace, and nightly sets. Special performances by championship dancers. VIP packages available including meet & greets. Hotel discounts for out-of-town guests. This is THE stepping event of the summer!",
        eventType: "TICKETED_EVENT",
        categories: ["Festival", "Competition", "Social"],
        startDate: new Date("2025-08-08T18:00:00").getTime(),
        endDate: new Date("2025-08-10T23:00:00").getTime(),
        timezone: "America/Detroit",
        location: {
          venueName: "Detroit Marriott Renaissance Center",
          address: "400 Renaissance Center",
          city: "Detroit",
          state: "MI",
          zipCode: "48243",
          country: "United States",
        },
        capacity: 1000,
      },
    ];

    const results = [];

    for (let i = 0; i < demoEvents.length; i++) {
      const event = demoEvents[i];
      console.log(`\n📌 Creating Event ${i + 1}/${demoEvents.length}:`);
      console.log(`   Name: ${event.name}`);
      console.log(`   Location: ${event.location.city}, ${event.location.state}`);
      console.log(`   Date: ${new Date(event.startDate).toLocaleDateString()}`);

      try {
        const result = await client.mutation("events/mutations:createEvent", event);
        console.log(`   ✅ Created with ID: ${result}`);
        results.push({ eventId: result, name: event.name });
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log(`\n\n✨ Demo events created successfully!`);
    console.log(`\n📊 Summary:`);
    console.log(`   Total Created: ${results.length}/${demoEvents.length}`);
    console.log(`\n📋 Event IDs:`);
    results.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name}`);
      console.log(`      ID: ${r.eventId}`);
    });

    console.log(`\n🎯 Next Step: Publish these events!`);
    console.log(`   Run: npx convex run admin:publishAllDraftEvents\n`);

    return results;
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createDemoEvents();
