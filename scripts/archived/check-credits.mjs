#!/usr/bin/env node

/**
 * Check credit allocation for all users
 */

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function checkCredits() {
  console.log("💰 Checking credit allocation...\n");

  try {
    // Query all users and their credits
    const users = await client.query("users/queries:listAllUsers");

    console.log("👥 Users in system:");
    console.log("=".repeat(80));

    for (const user of users) {
      console.log(`\n📧 Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   User ID: ${user._id}`);

      // Get credits for this user
      const credits = await client.query("credits/queries:getOrganizerCredits", {
        organizerId: user._id
      });

      if (credits) {
        console.log(`   💳 Credits Total: ${credits.creditsTotal}`);
        console.log(`   💸 Credits Used: ${credits.creditsUsed}`);
        console.log(`   💰 Credits Remaining: ${credits.creditsRemaining}`);
        console.log(`   🎁 First Event Free Used: ${credits.firstEventFreeUsed}`);
      } else {
        console.log(`   ❌ No credits allocated yet`);
      }
    }

    console.log("\n" + "=".repeat(80));

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkCredits();
