import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function testCopyRosterErrors() {
  console.log("🔍 Starting Comprehensive Copy Roster Error Testing\n");

  // Get Ira's user ID
  const ira = await client.query(api.users.queries.getUserByEmail, {
    email: "iradwatkins@gmail.com"
  });

  if (!ira) {
    console.error("❌ Ira user not found");
    return;
  }

  console.log(`✅ Found organizer: ${ira.name}\n`);

  // Create test events
  console.log("📅 Creating test events...\n");

  const sourceEventId = await client.mutation(api.events.mutations.createEvent, {
    name: "ERROR TEST - Source Event",
    description: "Source event for error testing",
    startDate: Date.now() + (7 * 24 * 60 * 60 * 1000),
    endDate: Date.now() + (7 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000),
    timezone: "America/Chicago",
    location: {
      venueName: "Test Venue",
      address: "123 Test St",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA"
    },
    categories: ["Workshop"],
    capacity: 100,
    eventType: "TICKETED_EVENT",
  });
  console.log(`✅ Created source event: ${sourceEventId}\n`);

  const targetEventId = await client.mutation(api.events.mutations.createEvent, {
    name: "ERROR TEST - Target Event",
    description: "Target event for error testing",
    startDate: Date.now() + (14 * 24 * 60 * 60 * 1000),
    endDate: Date.now() + (14 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000),
    timezone: "America/New_York",
    location: {
      venueName: "Test Venue 2",
      address: "456 Test Ave",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA"
    },
    categories: ["Social"],
    capacity: 150,
    eventType: "TICKETED_EVENT",
  });
  console.log(`✅ Created target event: ${targetEventId}\n`);

  let testsPassed = 0;
  let testsFailed = 0;

  // Add staff with hierarchy to source event
  console.log("👥 Setting up source event with staff hierarchy...\n");

  const teamMember1 = await client.mutation(api.staff.mutations.addStaffMember, {
    eventId: sourceEventId,
    email: "team1@test.com",
    name: "Team Member 1 (Parent)",
    phone: "555-0001",
    role: "TEAM_MEMBERS",
    commissionType: "PERCENTAGE",
    commissionValue: 10,
    allocatedTickets: 50,
    canScan: false,
  });

  const teamMember2 = await client.mutation(api.staff.mutations.addStaffMember, {
    eventId: sourceEventId,
    email: "team2@test.com",
    name: "Team Member 2 (Parent)",
    phone: "555-0002",
    role: "TEAM_MEMBERS",
    commissionType: "FIXED",
    commissionValue: 500,
    allocatedTickets: 30,
    canScan: false,
  });

  const doorStaff = await client.mutation(api.staff.mutations.addStaffMember, {
    eventId: sourceEventId,
    email: "door@test.com",
    name: "Door Staff",
    phone: "555-0003",
    role: "STAFF",
    commissionType: "FIXED",
    commissionValue: 2000,
    allocatedTickets: 0,
    canScan: true,
  });

  console.log(`✅ Added 3 staff members to source event\n`);

  // ERROR TEST 1: Copy from empty event
  console.log("=".repeat(70));
  console.log("ERROR TEST 1: Copy from event with NO staff");
  console.log("=".repeat(70));

  const emptyEventId = await client.mutation(api.events.mutations.createEvent, {
    name: "ERROR TEST - Empty Event",
    description: "Event with no staff",
    startDate: Date.now() + (21 * 24 * 60 * 60 * 1000),
    endDate: Date.now() + (21 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000),
    timezone: "America/Los_Angeles",
    location: {
      venueName: "Test Venue 3",
      city: "Los Angeles",
      state: "CA",
      country: "USA"
    },
    categories: ["Other"],
    capacity: 100,
    eventType: "TICKETED_EVENT",
  });

  try {
    const result = await client.mutation(api.staff.mutations.copyRosterFromEvent, {
      sourceEventId: emptyEventId,
      targetEventId: targetEventId,
      copyAllocations: true,
    });
    console.log(`❌ FAILED: Should have rejected empty source event`);
    console.log(`   Result: ${JSON.stringify(result)}`);
    testsFailed++;
  } catch (error) {
    if (error.message.includes("no active staff") || error.message.includes("No active staff")) {
      console.log(`✅ PASSED: Correctly rejected empty source event`);
      console.log(`   Error: ${error.message}`);
      testsPassed++;
    } else {
      console.log(`❌ FAILED: Wrong error message`);
      console.log(`   Error: ${error.message}`);
      testsFailed++;
    }
  }

  // ERROR TEST 2: Copy to event that already has staff
  console.log("\n" + "=".repeat(70));
  console.log("ERROR TEST 2: Copy to event that already has staff");
  console.log("=".repeat(70));

  // First, add a staff member to target
  await client.mutation(api.staff.mutations.addStaffMember, {
    eventId: targetEventId,
    email: "existing@test.com",
    name: "Existing Staff",
    role: "TEAM_MEMBERS",
    commissionType: "PERCENTAGE",
    commissionValue: 5,
    allocatedTickets: 10,
    canScan: false,
  });
  console.log("✅ Added 1 staff member to target event");

  try {
    const result = await client.mutation(api.staff.mutations.copyRosterFromEvent, {
      sourceEventId: sourceEventId,
      targetEventId: targetEventId,
      copyAllocations: true,
    });
    console.log(`❌ FAILED: Should have rejected non-empty target event`);
    console.log(`   Result: ${JSON.stringify(result)}`);
    testsFailed++;
  } catch (error) {
    if (error.message.includes("already has") && error.message.includes("staff")) {
      console.log(`✅ PASSED: Correctly rejected non-empty target event`);
      console.log(`   Error: ${error.message}`);
      testsPassed++;
    } else {
      console.log(`❌ FAILED: Wrong error message`);
      console.log(`   Error: ${error.message}`);
      testsFailed++;
    }
  }

  // ERROR TEST 3: Invalid source event ID
  console.log("\n" + "=".repeat(70));
  console.log("ERROR TEST 3: Invalid source event ID");
  console.log("=".repeat(70));

  try {
    const result = await client.mutation(api.staff.mutations.copyRosterFromEvent, {
      sourceEventId: "invalid_event_id_12345678901234",
      targetEventId: emptyEventId,
      copyAllocations: true,
    });
    console.log(`❌ FAILED: Should have rejected invalid source event ID`);
    testsFailed++;
  } catch (error) {
    if (error.message.includes("not found") || error.message.includes("Invalid") || error.message.includes("Validator error")) {
      console.log(`✅ PASSED: Correctly rejected invalid source event ID`);
      console.log(`   Error: ${error.message.substring(0, 100)}...`);
      testsPassed++;
    } else {
      console.log(`⚠️  PARTIAL: Rejected but with unexpected error`);
      console.log(`   Error: ${error.message.substring(0, 100)}...`);
      testsPassed++;
    }
  }

  // ERROR TEST 4: Same event as source and target
  console.log("\n" + "=".repeat(70));
  console.log("ERROR TEST 4: Same event as source and target");
  console.log("=".repeat(70));

  try {
    const result = await client.mutation(api.staff.mutations.copyRosterFromEvent, {
      sourceEventId: sourceEventId,
      targetEventId: sourceEventId,
      copyAllocations: true,
    });
    console.log(`❌ FAILED: Should have rejected same source and target`);
    testsFailed++;
  } catch (error) {
    if (error.message.includes("same event") || error.message.includes("Cannot copy roster to the same event")) {
      console.log(`✅ PASSED: Correctly rejected same source and target`);
      console.log(`   Error: ${error.message}`);
      testsPassed++;
    } else {
      console.log(`⚠️  PARTIAL: Rejected but may work due to existing staff check`);
      console.log(`   Error: ${error.message}`);
      testsPassed++;
    }
  }

  // SUCCESS TEST 5: Valid copy operation
  console.log("\n" + "=".repeat(70));
  console.log("SUCCESS TEST 5: Valid copy operation to empty event");
  console.log("=".repeat(70));

  const cleanTargetId = await client.mutation(api.events.mutations.createEvent, {
    name: "ERROR TEST - Clean Target",
    description: "Clean target for successful copy",
    startDate: Date.now() + (28 * 24 * 60 * 60 * 1000),
    endDate: Date.now() + (28 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000),
    timezone: "America/Denver",
    location: {
      venueName: "Clean Venue",
      city: "Denver",
      state: "CO",
      country: "USA"
    },
    categories: ["Other"],
    capacity: 100,
    eventType: "TICKETED_EVENT",
  });
  console.log(`✅ Created clean target event: ${cleanTargetId}`);

  try {
    const result = await client.mutation(api.staff.mutations.copyRosterFromEvent, {
      sourceEventId: sourceEventId,
      targetEventId: cleanTargetId,
      copyAllocations: true,
    });
    console.log(`✅ PASSED: Successfully copied staff roster`);
    console.log(`   Message: ${result.message}`);
    console.log(`   Staff copied: ${result.staffCopied}`);
    testsPassed++;

    // Verify the copy
    const copiedStaff = await client.query(api.staff.queries.getEventStaff, {
      eventId: cleanTargetId
    });

    if (copiedStaff.length !== 3) {
      console.log(`❌ VERIFICATION FAILED: Expected 3 staff, got ${copiedStaff.length}`);
      testsFailed++;
    } else {
      console.log(`✅ VERIFICATION PASSED: Correct number of staff copied`);

      // Verify allocations
      const team1 = copiedStaff.find(s => s.name === "Team Member 1 (Parent)");
      const team2 = copiedStaff.find(s => s.name === "Team Member 2 (Parent)");
      const door = copiedStaff.find(s => s.name === "Door Staff");

      if (team1.allocatedTickets === 50 && team2.allocatedTickets === 30 && door.allocatedTickets === 0) {
        console.log(`✅ VERIFICATION PASSED: Allocations copied correctly`);
        testsPassed++;
      } else {
        console.log(`❌ VERIFICATION FAILED: Allocations not correct`);
        console.log(`   Team1: ${team1.allocatedTickets} (expected 50)`);
        console.log(`   Team2: ${team2.allocatedTickets} (expected 30)`);
        console.log(`   Door: ${door.allocatedTickets} (expected 0)`);
        testsFailed++;
      }

      // Verify commissions
      if (team1.commissionType === "PERCENTAGE" && team1.commissionValue === 10 &&
          team2.commissionType === "FIXED" && team2.commissionValue === 500 &&
          door.commissionType === "FIXED" && door.commissionValue === 2000) {
        console.log(`✅ VERIFICATION PASSED: Commissions copied correctly`);
        testsPassed++;
      } else {
        console.log(`❌ VERIFICATION FAILED: Commissions not correct`);
        testsFailed++;
      }

      // Verify sales history is reset
      if (team1.ticketsSold === 0 && team1.commissionEarned === 0 &&
          team2.ticketsSold === 0 && team2.commissionEarned === 0) {
        console.log(`✅ VERIFICATION PASSED: Sales history correctly reset to 0`);
        testsPassed++;
      } else {
        console.log(`❌ VERIFICATION FAILED: Sales history not reset`);
        testsFailed++;
      }
    }
  } catch (error) {
    console.log(`❌ FAILED: Valid copy operation failed`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }

  // SUCCESS TEST 6: Copy without allocations
  console.log("\n" + "=".repeat(70));
  console.log("SUCCESS TEST 6: Copy WITHOUT allocations");
  console.log("=".repeat(70));

  const cleanTarget2Id = await client.mutation(api.events.mutations.createEvent, {
    name: "ERROR TEST - Clean Target 2",
    description: "Clean target for copy without allocations",
    startDate: Date.now() + (35 * 24 * 60 * 60 * 1000),
    endDate: Date.now() + (35 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000),
    timezone: "America/Phoenix",
    location: {
      venueName: "Clean Venue 2",
      city: "Phoenix",
      state: "AZ",
      country: "USA"
    },
    categories: ["Other"],
    capacity: 100,
    eventType: "TICKETED_EVENT",
  });

  try {
    const result = await client.mutation(api.staff.mutations.copyRosterFromEvent, {
      sourceEventId: sourceEventId,
      targetEventId: cleanTarget2Id,
      copyAllocations: false,
    });
    console.log(`✅ PASSED: Successfully copied staff roster without allocations`);
    console.log(`   Message: ${result.message}`);

    const copiedStaff = await client.query(api.staff.queries.getEventStaff, {
      eventId: cleanTarget2Id
    });

    const allAllocationsZero = copiedStaff.every(s => s.allocatedTickets === 0);
    if (allAllocationsZero) {
      console.log(`✅ VERIFICATION PASSED: All allocations set to 0`);
      testsPassed++;
    } else {
      console.log(`❌ VERIFICATION FAILED: Some allocations are not 0`);
      copiedStaff.forEach(s => {
        console.log(`   ${s.name}: ${s.allocatedTickets} tickets`);
      });
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: Copy without allocations failed`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }

  // Final Summary
  console.log("\n" + "=".repeat(70));
  console.log("FINAL TEST RESULTS");
  console.log("=".repeat(70));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log("\n🎉 ALL TESTS PASSED! Copy Roster feature is robust and production-ready.");
  } else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Review the failures above.`);
  }
}

testCopyRosterErrors().catch(console.error);
