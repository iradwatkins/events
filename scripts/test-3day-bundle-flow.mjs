/**
 * Test Script for 3-Day Event Bundle Flow
 *
 * Tests the complete tier allocation and bundle sales system:
 * 1. Create a single 3-day event with day-specific tiers
 * 2. Create 4 Team Members and 2-4 Associates each
 * 3. Allocate tickets randomly to Team Members (intentionally create gaps)
 * 4. Team Members transfer tickets to Associates
 * 5. Test bundle eligibility and sales
 * 6. Document all issues found
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

// Helper to generate random number in range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to shuffle array
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function main() {
  console.log("🎫 TESTING 3-DAY EVENT WITH TIER ALLOCATIONS & BUNDLES");
  console.log("=" + "=".repeat(60) + "\n");

  const issues = [];

  try {
    // STEP 1: Create the 3-day event
    console.log("📅 STEP 1: Creating 3-day event...");

    const startDate = new Date("2025-12-19T19:00:00-05:00").getTime(); // Friday 7pm
    const endDate = new Date("2025-12-21T23:59:59-05:00").getTime(); // Sunday 11:59pm

    const eventId = await client.mutation(api.events.mutations.createEvent, {
      name: "Holiday Season Step Fest 2025",
      description: "A 3-day stepping extravaganza! Buy tickets for each day or save with our weekend bundle.",
      startDate,
      endDate,
      timezone: "America/Chicago",
      eventType: "TICKETED_EVENT",
      capacity: 3000,
      location: {
        venueName: "Chicago Steppers Paradise",
        address: "123 Step Ave",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
        country: "US"
      },
      categories: ["Steppers", "Multi-Day Event"]
    });

    console.log(`   ✅ Event created: ${eventId}\n`);

    // STEP 2: Create 3 ticket tiers (one for each day)
    console.log("🎟️  STEP 2: Creating day-specific ticket tiers...");

    const tiers = [];
    const days = [
      { name: "Friday Night Pass", price: 3500, dayNumber: 1, quantity: 1000 },
      { name: "Saturday Night Pass", price: 4000, dayNumber: 2, quantity: 1000 },
      { name: "Sunday Finale Pass", price: 3000, dayNumber: 3, quantity: 1000 }
    ];

    for (const day of days) {
      const tierId = await client.mutation(api.tickets.mutations.createTicketTier, {
        eventId,
        name: day.name,
        description: `Access to day ${day.dayNumber} of the Holiday Weekend festivities`,
        price: day.price,
        quantity: day.quantity,
        dayNumber: day.dayNumber,
        saleStart: Date.now(),
        saleEnd: startDate
      });

      tiers.push({ ...day, id: tierId });
      console.log(`   ✅ Created: ${day.name} (${day.quantity} tickets @ $${day.price / 100})`);
    }
    console.log();

    // STEP 3: Create weekend bundle (1 of each day)
    console.log("🎁 STEP 3: Creating weekend bundle...");

    const bundlePrice = 9000; // $90 (saves $15)
    const regularPrice = tiers.reduce((sum, t) => sum + t.price, 0);
    const savings = regularPrice - bundlePrice;

    const bundleId = await client.mutation(api.bundles.mutations.createTicketBundle, {
      eventId, // Single event with multiple days
      name: "Holiday Weekend Pass",
      description: "Full access to all 3 days! Friday + Saturday + Sunday",
      price: bundlePrice,
      totalQuantity: 500, // 500 bundles available
      includedTiers: tiers.map(t => ({
        tierId: t.id,
        tierName: t.name,
        quantity: 1
      }))
    });

    console.log(`   ✅ Bundle created: ${bundleId}`);
    console.log(`   💰 Price: $${bundlePrice / 100} (saves $${savings / 100})\n`);

    // STEP 4: Create 4 Team Members
    console.log("👥 STEP 4: Creating 4 Team Members...");

    const teamMemberNames = ["Alpha", "Beta", "Gamma", "Delta"];
    const teamMembers = [];

    for (const name of teamMemberNames) {
      const result = await client.mutation(api.staff.mutations.addStaffMember, {
        eventId,
        name: `Team ${name}`,
        email: `team.${name.toLowerCase()}@test.com`,
        role: "TEAM_MEMBERS",
        commissionType: "PERCENTAGE",
        commissionValue: 10 // 10% commission
      });

      const staffId = result.staffId;
      teamMembers.push({ name, id: staffId });
      console.log(`   ✅ Created: Team ${name} (${staffId})`);
    }
    console.log();

    // STEP 5: Allocate tickets to Team Members (intentionally random & uneven)
    console.log("📦 STEP 5: Allocating tickets to Team Members (RANDOM & UNEVEN)...");
    console.log("   Goal: Create scenarios where some have full sets, others need transfers\n");

    const allocations = [];

    for (const tm of teamMembers) {
      console.log(`   Team ${tm.name}:`);

      // Randomly decide which days they get tickets for
      const hasFriday = Math.random() > 0.3; // 70% chance
      const hasSaturday = Math.random() > 0.2; // 80% chance
      const hasSunday = Math.random() > 0.3; // 70% chance

      const tmAllocation = { teamMember: tm.name, tickets: {} };

      for (const tier of tiers) {
        const shouldAllocate =
          (tier.dayNumber === 1 && hasFriday) ||
          (tier.dayNumber === 2 && hasSaturday) ||
          (tier.dayNumber === 3 && hasSunday);

        if (shouldAllocate) {
          const quantity = randomInt(50, 200); // Random allocation

          await client.mutation(api.staff.tierAllocations.allocateTierToStaff, {
            staffId: tm.id,
            tierId: tier.id,
            quantity
          });

          tmAllocation.tickets[tier.name] = quantity;
          console.log(`      ✓ ${tier.name}: ${quantity} tickets`);
        } else {
          tmAllocation.tickets[tier.name] = 0;
          console.log(`      ✗ ${tier.name}: 0 tickets (GAP!)`);
        }
      }

      // Check if they can sell bundles
      const hasFull = hasFriday && hasSaturday && hasSunday;
      console.log(`      ${hasFull ? "✅ CAN sell bundles" : "❌ CANNOT sell bundles (missing days)"}`);
      console.log();

      allocations.push(tmAllocation);
    }

    // STEP 6: Create Associates for each Team Member
    console.log("👤 STEP 6: Creating Associates for each Team Member...");

    const associates = [];

    for (const tm of teamMembers) {
      const numAssociates = randomInt(2, 4);
      console.log(`   Team ${tm.name}: Creating ${numAssociates} associates`);

      for (let i = 0; i < numAssociates; i++) {
        const associateName = `${tm.name}-Associate-${i + 1}`;

        const result = await client.mutation(api.staff.mutations.addStaffMember, {
          eventId,
          name: associateName,
          email: `${associateName.toLowerCase().replace(/\s+/g, ".")}@test.com`,
          role: "ASSOCIATES",
          assignedByStaffId: tm.id, // Assigned by this Team Member
          commissionType: "PERCENTAGE",
          commissionValue: 5 // 5% commission
        });

        const associateId = result.staffId;
        associates.push({
          id: associateId,
          name: associateName,
          teamMember: tm.name,
          teamMemberId: tm.id
        });

        console.log(`      ✓ ${associateName} (${associateId})`);
      }
      console.log();
    }

    // STEP 7: Team Members transfer tickets to Associates (random)
    console.log("🔄 STEP 7: Team Members transferring tickets to Associates...");
    console.log("   (Creating MORE gaps and bundle eligibility challenges)\n");

    for (const tm of teamMembers) {
      const tmAssociates = associates.filter(a => a.teamMemberId === tm.id);
      console.log(`   Team ${tm.name} → ${tmAssociates.length} associates:`);

      for (const associate of tmAssociates) {
        // Randomly transfer some days to this associate
        for (const tier of tiers) {
          const shouldTransfer = Math.random() > 0.5; // 50% chance

          if (shouldTransfer) {
            try {
              const transferQuantity = randomInt(10, 50);

              await client.mutation(api.staff.tierAllocations.transferTierToAssociate, {
                fromStaffId: tm.id,
                toStaffId: associate.id,
                tierId: tier.id,
                quantity: transferQuantity
              });

              console.log(`      ✓ ${associate.name}: ${transferQuantity}x ${tier.name}`);
            } catch (error) {
              console.log(`      ✗ ${associate.name}: ${tier.name} - ${error.message}`);
              issues.push({
                step: "Transfer tickets",
                issue: `Failed to transfer ${tier.name} from Team ${tm.name} to ${associate.name}`,
                error: error.message
              });
            }
          }
        }
      }
      console.log();
    }

    // STEP 8: Check bundle eligibility for ALL staff
    console.log("🎯 STEP 8: Checking bundle eligibility for ALL staff...");
    console.log("   (Who can sell the Weekend Pass bundle?)\n");

    const allStaff = [...teamMembers.map(tm => ({ ...tm, role: "TEAM_MEMBERS" })), ...associates.map(a => ({ ...a, role: "ASSOCIATES" }))];

    const eligibleStaff = [];
    const ineligibleStaff = [];

    for (const staff of allStaff) {
      try {
        const result = await client.query(api.staff.bundleSales.canStaffSellBundle, {
          staffId: staff.id,
          bundleId
        });

        if (result.canSell) {
          eligibleStaff.push(staff.name);
          console.log(`   ✅ ${staff.name} (${staff.role}): CAN sell bundles`);
        } else {
          ineligibleStaff.push({ name: staff.name, reason: result.reason });
          console.log(`   ❌ ${staff.name} (${staff.role}): ${result.reason}`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${staff.name}: Error checking eligibility - ${error.message}`);
        issues.push({
          step: "Check bundle eligibility",
          staff: staff.name,
          error: error.message
        });
      }
    }

    console.log();
    console.log(`   Summary: ${eligibleStaff.length} can sell, ${ineligibleStaff.length} cannot\n`);

    // STEP 9: Test bundle sale (if anyone is eligible)
    if (eligibleStaff.length > 0) {
      console.log("💰 STEP 9: Testing bundle sale...");

      const testStaffName = eligibleStaff[0];
      const testStaff = allStaff.find(s => s.name === testStaffName);

      console.log(`   Testing with: ${testStaffName}`);

      try {
        const saleResult = await client.mutation(api.staff.bundleSales.createStaffBundleSale, {
          staffId: testStaff.id,
          bundleId,
          buyerName: "John Test Customer",
          buyerEmail: "john.customer@test.com",
          paymentMethod: "CASH"
        });

        console.log(`   ✅ Bundle sale successful!`);
        console.log(`      Order ID: ${saleResult.orderId}`);
        console.log(`      Tickets created: ${saleResult.ticketCount}`);
        console.log(`      Total: $${saleResult.totalPrice / 100}`);
        console.log(`      Commission: $${saleResult.commission / 100}`);
        console.log();
      } catch (error) {
        console.log(`   ❌ Bundle sale FAILED: ${error.message}\n`);
        issues.push({
          step: "Test bundle sale",
          staff: testStaffName,
          error: error.message
        });
      }
    } else {
      console.log("⚠️  STEP 9: SKIPPED - No staff eligible to sell bundles!\n");
      issues.push({
        step: "Test bundle sale",
        issue: "No staff members have complete day sets to sell bundles"
      });
    }

    // STEP 10: Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log();
    console.log(`✅ Event Created: ${eventId}`);
    console.log(`✅ Tiers Created: ${tiers.length} (${tiers.map(t => t.name).join(", ")})`);
    console.log(`✅ Bundle Created: ${bundleId}`);
    console.log(`✅ Team Members: ${teamMembers.length}`);
    console.log(`✅ Associates: ${associates.length}`);
    console.log(`✅ Eligible to sell bundles: ${eligibleStaff.length}`);
    console.log(`❌ Ineligible (need transfers): ${ineligibleStaff.length}`);
    console.log();

    if (issues.length > 0) {
      console.log("⚠️  ISSUES FOUND:");
      console.log("=".repeat(60));
      issues.forEach((issue, i) => {
        console.log(`\n${i + 1}. ${issue.step}`);
        if (issue.staff) console.log(`   Staff: ${issue.staff}`);
        if (issue.issue) console.log(`   Issue: ${issue.issue}`);
        if (issue.error) console.log(`   Error: ${issue.error}`);
      });
      console.log();
    } else {
      console.log("✅ NO ISSUES FOUND - All systems working correctly!");
      console.log();
    }

    console.log("=".repeat(60));
    console.log("✅ TEST COMPLETE");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\n❌ FATAL ERROR:");
    console.error(error);
    console.error("\nStack trace:");
    console.error(error.stack);
    process.exit(1);
  }
}

main();
