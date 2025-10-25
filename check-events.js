// ESLint disable for Node.js utility script
/* eslint-disable @typescript-eslint/no-require-imports */
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("./convex/_generated/api");

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://wise-finch-196.convex.cloud";

async function checkEvents() {
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    console.log("🔍 Checking events database...\n");

    const result = await client.query(api.debug.listAllEvents, {});

    console.log("📊 EVENT DATABASE SUMMARY");
    console.log("=".repeat(50));
    console.log(`Total Events: ${result.total}`);
    console.log(`\nBy Status:`);
    console.log(`  - DRAFT:     ${result.byStatus.DRAFT}`);
    console.log(`  - PUBLISHED: ${result.byStatus.PUBLISHED}`);
    console.log(`  - CANCELLED: ${result.byStatus.CANCELLED}`);
    console.log("=".repeat(50));

    if (result.events.length === 0) {
      console.log("\n❌ NO EVENTS FOUND IN DATABASE");
      console.log("\nThis means:");
      console.log("1. No events have been successfully created yet");
      console.log("2. You need to create an event through the UI");
      console.log("3. Make sure you're signed in when creating events");
    } else {
      console.log("\n📋 EVENTS LIST:\n");
      result.events.forEach((event, index) => {
        const date = new Date(event.createdAt).toLocaleString();
        console.log(`${index + 1}. ${event.name}`);
        console.log(`   ID: ${event.id}`);
        console.log(`   Status: ${event.status}`);
        console.log(`   Created: ${date}`);
        console.log(`   Has Image: ${event.hasImage ? "Yes" : "No"}`);
        console.log();
      });

      const drafts = result.events.filter((e) => e.status === "DRAFT");
      if (drafts.length > 0) {
        console.log("\n⚠️  DRAFT EVENTS FOUND");
        console.log("These events need to be PUBLISHED to appear on homepage:");
        drafts.forEach((e) => {
          console.log(`  - ${e.name} (ID: ${e.id})`);
          console.log(`    → Go to: /organizer/events/${e.id}`);
          console.log(`    → Click "Publish Event" button`);
        });
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkEvents();
