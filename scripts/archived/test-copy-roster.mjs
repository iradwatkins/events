import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function testCopyRoster() {
  console.log("🚀 Starting Copy Roster Test\n");

  // Get Ira's user ID (organizer)
  const ira = await client.query(api.users.queries.getUserByEmail, {
    email: "iradwatkins@gmail.com"
  });

  if (!ira) {
    console.error("❌ Ira user not found");
    return;
  }

  console.log(`✅ Found organizer: ${ira.name} (${ira._id})\n`);

  // Create 3 test events
  console.log("📅 Creating 3 test events...\n");

  const event1Id = await client.mutation(api.events.mutations.createEvent, {
    name: "Test Event 1 - Source Event",
    description: "Source event with staff roster",
    startDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 1 week from now
    endDate: Date.now() + (7 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000), // 4 hours later
    timezone: "America/Chicago",
    location: {
      venueName: "Test Venue 1",
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
  console.log(`✅ Created Event 1: ${event1Id}`);

  const event2Id = await client.mutation(api.events.mutations.createEvent, {
    name: "Test Event 2 - Copy Target 1",
    description: "First target for roster copy",
    startDate: Date.now() + (14 * 24 * 60 * 60 * 1000), // 2 weeks from now
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
  console.log(`✅ Created Event 2: ${event2Id}`);

  const event3Id = await client.mutation(api.events.mutations.createEvent, {
    name: "Test Event 3 - Copy Target 2",
    description: "Second target for roster copy",
    startDate: Date.now() + (21 * 24 * 60 * 60 * 1000), // 3 weeks from now
    endDate: Date.now() + (21 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000),
    timezone: "America/Los_Angeles",
    location: {
      venueName: "Test Venue 3",
      address: "789 Test Blvd",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      country: "USA"
    },
    categories: ["Competition"],
    capacity: 200,
    eventType: "TICKETED_EVENT",
  });
  console.log(`✅ Created Event 3: ${event3Id}\n`);

  // Add staff to Event 1
  console.log("👥 Adding staff to Event 1 (source event)...\n");

  const staff1Id = await client.mutation(api.staff.mutations.addStaffMember, {
    eventId: event1Id,
    email: "seller1@test.com",
    name: "Team Member 1",
    phone: "555-0001",
    role: "TEAM_MEMBERS",
    commissionType: "PERCENTAGE",
    commissionValue: 10,
    allocatedTickets: 50,
    canScan: false,
  });
  console.log(`✅ Added Team Member 1 with 50 ticket allocation`);

  const staff2Id = await client.mutation(api.staff.mutations.addStaffMember, {
    eventId: event1Id,
    email: "seller2@test.com",
    name: "Team Member 2",
    phone: "555-0002",
    role: "TEAM_MEMBERS",
    commissionType: "FIXED",
    commissionValue: 500, // $5.00 per ticket
    allocatedTickets: 30,
    canScan: false,
  });
  console.log(`✅ Added Team Member 2 with 30 ticket allocation`);

  const staff3Id = await client.mutation(api.staff.mutations.addStaffMember, {
    eventId: event1Id,
    email: "scanner1@test.com",
    name: "Door Staff 1",
    phone: "555-0003",
    role: "STAFF",
    commissionType: "FIXED",
    commissionValue: 2000, // $20.00 per event
    allocatedTickets: 0,
    canScan: true,
  });
  console.log(`✅ Added Door Staff 1 (scanner)`);

  // Get staff from Event 1 to verify
  const event1Staff = await client.query(api.staff.queries.getEventStaff, {
    eventId: event1Id
  });
  console.log(`\n📊 Event 1 has ${event1Staff.length} staff members`);

  // Test 1: Copy roster to Event 2 WITH allocations
  console.log("\n" + "=".repeat(60));
  console.log("TEST 1: Copy roster from Event 1 to Event 2 WITH allocations");
  console.log("=".repeat(60) + "\n");

  const result1 = await client.mutation(api.staff.mutations.copyRosterFromEvent, {
    sourceEventId: event1Id,
    targetEventId: event2Id,
    copyAllocations: true,
  });
  console.log(`✅ ${result1.message}`);
  console.log(`   Staff copied: ${result1.staffCopied}`);

  const event2Staff = await client.query(api.staff.queries.getEventStaff, {
    eventId: event2Id
  });
  console.log(`\n📊 Event 2 now has ${event2Staff.length} staff members:`);
  event2Staff.forEach(staff => {
    const commissionStr = staff.commissionType === "PERCENTAGE"
      ? staff.commissionValue + "%"
      : "$" + (staff.commissionValue / 100).toFixed(2);
    console.log(`   - ${staff.name} (${staff.role})`);
    console.log(`     Allocation: ${staff.allocatedTickets} tickets`);
    console.log(`     Commission: ${commissionStr}`);
  });

  // Test 2: Copy roster to Event 3 WITHOUT allocations
  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: Copy roster from Event 1 to Event 3 WITHOUT allocations");
  console.log("=".repeat(60) + "\n");

  const result2 = await client.mutation(api.staff.mutations.copyRosterFromEvent, {
    sourceEventId: event1Id,
    targetEventId: event3Id,
    copyAllocations: false,
  });
  console.log(`✅ ${result2.message}`);
  console.log(`   Staff copied: ${result2.staffCopied}`);

  const event3Staff = await client.query(api.staff.queries.getEventStaff, {
    eventId: event3Id
  });
  console.log(`\n📊 Event 3 now has ${event3Staff.length} staff members:`);
  event3Staff.forEach(staff => {
    const commissionStr = staff.commissionType === "PERCENTAGE"
      ? staff.commissionValue + "%"
      : "$" + (staff.commissionValue / 100).toFixed(2);
    console.log(`   - ${staff.name} (${staff.role})`);
    console.log(`     Allocation: ${staff.allocatedTickets} tickets (should be 0)`);
    console.log(`     Commission: ${commissionStr}`);
  });

  // Test 3: Copy roster from Event 2 to Event 3 (should add, not replace)
  console.log("\n" + "=".repeat(60));
  console.log("TEST 3: Copy roster from Event 2 to Event 3 (testing add mode)");
  console.log("=".repeat(60) + "\n");

  // First, add one unique staff member to Event 2
  await client.mutation(api.staff.mutations.addStaffMember, {
    eventId: event2Id,
    email: "unique@test.com",
    name: "Unique Team Member",
    phone: "555-9999",
    role: "TEAM_MEMBERS",
    commissionType: "PERCENTAGE",
    commissionValue: 15,
    allocatedTickets: 25,
    canScan: false,
  });
  console.log("✅ Added unique staff member to Event 2");

  const result3 = await client.mutation(api.staff.mutations.copyRosterFromEvent, {
    sourceEventId: event2Id,
    targetEventId: event3Id,
    copyAllocations: true,
  });
  console.log(`✅ ${result3.message}`);
  console.log(`   Staff copied: ${result3.staffCopied}`);

  const event3StaffAfter = await client.query(api.staff.queries.getEventStaff, {
    eventId: event3Id
  });
  console.log(`\n📊 Event 3 now has ${event3StaffAfter.length} staff members (was ${event3Staff.length}):`);
  event3StaffAfter.forEach(staff => {
    console.log(`   - ${staff.name} (${staff.role}) - Allocation: ${staff.allocatedTickets}`);
  });

  // Final Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Event 1 (source): ${event1Staff.length} staff members`);
  console.log(`✅ Event 2 (copy with allocations): ${event2Staff.length + 1} staff members`);
  console.log(`✅ Event 3 (copy without allocations, then add more): ${event3StaffAfter.length} staff members`);
  console.log(`\n✅ All copy roster tests completed successfully!\n`);

  console.log("Test Event IDs:");
  console.log(`  Event 1: ${event1Id}`);
  console.log(`  Event 2: ${event2Id}`);
  console.log(`  Event 3: ${event3Id}`);
}

testCopyRoster().catch(console.error);
