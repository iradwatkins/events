import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";

const convex = new ConvexHttpClient(CONVEX_URL);

const organizerEmails = [
  "organizer1@stepperslife.com",
  "organizer2@stepperslife.com",
  "organizer3@stepperslife.com"
];

async function updateOrganizerCredits() {
  try {
    console.log("🔧 Updating organizer credits from 1000 to 300...\n");

    let updated = 0;

    for (const email of organizerEmails) {
      try {
        // Get the user
        const user = await convex.query(api.users.queries.getUserByEmail, {
          email: email,
        });

        if (!user) {
          console.log(`⚠️  User not found: ${email}`);
          continue;
        }

        // Update credits using Convex mutation
        await convex.mutation(api.credits.mutations.resetToFreeCredits, {
          organizerId: user._id,
        });

        console.log(`✅ Updated: ${email} - Credits reset to 300`);
        updated++;
      } catch (error) {
        console.error(`❌ Error updating ${email}:`, error.message);
      }
    }

    console.log("\n📊 Summary:");
    console.log(`   ✅ Updated: ${updated} organizer accounts`);
    console.log(`   📝 Total: ${organizerEmails.length} organizer accounts\n`);
  } catch (error) {
    console.error("❌ Error updating organizer credits:", error);
    process.exit(1);
  }
}

updateOrganizerCredits();
