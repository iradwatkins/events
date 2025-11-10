import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function main() {
  console.log("🗑️  RESETTING ALL EVENTS AND RELATED DATA");
  console.log("==========================================\n");

  try {
    console.log("⚠️  WARNING: This will delete ALL events, staff, tickets, and related data!");
    console.log("This operation should be run via Convex internal mutation.\n");

    console.log("📋 To reset everything, run these commands in the Convex dashboard:\n");

    console.log("1. Delete all tickets:");
    console.log("   > In Convex Dashboard > Data > tickets table > Select All > Delete\n");

    console.log("2. Delete all event staff:");
    console.log("   > In Convex Dashboard > Data > eventStaff table > Select All > Delete\n");

    console.log("3. Delete all ticket tiers:");
    console.log("   > In Convex Dashboard > Data > ticketTiers table > Select All > Delete\n");

    console.log("4. Delete all events:");
    console.log("   > In Convex Dashboard > Data > events table > Select All > Delete\n");

    console.log("5. Optional - Delete all orders:");
    console.log("   > In Convex Dashboard > Data > orders table > Select All > Delete\n");

    console.log("6. Optional - Delete all payments:");
    console.log("   > In Convex Dashboard > Data > payments table > Select All > Delete\n");

    console.log("\n✅ After deletion, the system will be ready for fresh testing!");
    console.log("   Users and their credits will remain intact.\n");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  }

  process.exit(0);
}

main();
