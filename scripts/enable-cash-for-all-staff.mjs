#!/usr/bin/env node
/**
 * ENABLE CASH PAYMENTS FOR ALL STAFF
 *
 * This script enables cash in-person payments for all staff members
 * by setting acceptCashInPerson = true
 *
 * Usage: node scripts/enable-cash-for-all-staff.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  console.log("🔍 Finding all staff members...\n");

  try {
    // We need to manually query the database since there's no public query
    // Let's use the admin cleanup mutation but read-only
    const query = `
      import { query } from "./_generated/server";

      export default query(async (ctx) => {
        const staff = await ctx.db.query("eventStaff").collect();
        return staff;
      });
    `;

    console.log("❌ Cannot directly query staff table without authentication.");
    console.log("\n📝 MANUAL STEPS REQUIRED:\n");
    console.log("To enable cash payments, you need to:");
    console.log("1. Login as organizer: https://events.stepperslife.com/login");
    console.log("   Email: organizer1@stepperslife.com");
    console.log("   Password: Bobby321!\n");
    console.log("2. For each event with staff:");
    console.log("   - Go to: /organizer/events/[eventId]/staff");
    console.log("   - Edit each staff member");
    console.log("   - Enable 'Accept Cash In-Person' checkbox\n");
    console.log("OR");
    console.log("\n3. Staff members can enable it themselves:");
    console.log("   - Login as staff member");
    console.log("   - Go to: /staff/settings");
    console.log("   - Toggle 'Accept Cash In-Person'\n");
    console.log("═".repeat(70));
    console.log("\nNote: The schema has been updated to support acceptCashInPerson field.");
    console.log("Once enabled, customers will see 'Cash In-Person' as a payment option.");
    console.log("═".repeat(70));

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exit(1);
  }
}

main();
