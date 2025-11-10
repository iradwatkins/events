import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Calculate dates
const today = new Date();
const eventDate = new Date(today);
eventDate.setDate(eventDate.getDate() + 21); // 3 weeks from today

const formatDate = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

console.log("🎭 Creating Staff Hierarchy Test Event");
console.log("=====================================");
console.log(`Event Date: ${formatDate(eventDate)}`);
console.log(`Sales Start: ${formatDate(today)}`);
console.log("");

async function createStaffHierarchyTest() {
  try {
    // Step 1: Create the event
    console.log("📅 Step 1: Creating event...");
    const eventId = await client.mutation(api.events.mutations.createEvent, {
      name: `Chicago Steppers Social - ${formatDate(eventDate)}`,
      description: "Staff Hierarchy Test Event - Testing ticket distribution, sub-resellers, and commission structure",
      eventType: "TICKETED_EVENT",
      categories: ["Social Dance", "Stepping"],
      startDate: eventDate.getTime(),
      endDate: eventDate.getTime(),
      timezone: "America/Chicago",
      eventDateLiteral: formatDate(eventDate),
      eventTimeLiteral: "8:00 PM",
      eventTimezone: "America/Chicago",
      location: {
        venueName: "Test Venue",
        address: "123 Test Street",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
        country: "USA",
      },
      capacity: 5000,
      imageUrl: "",
    });
    console.log(`✅ Event created: ${eventId}`);
    console.log("");

    // Step 2: Create ticket tier
    console.log("🎟️  Step 2: Creating ticket tier (5,000 tickets @ $25 each)...");
    const tierId = await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "General Admission",
      description: "Standard entry ticket",
      price: 2500, // $25 in cents
      quantity: 5000,
      saleStart: today.getTime(),
      saleEnd: eventDate.getTime(),
    });
    console.log(`✅ Ticket tier created: ${tierId}`);
    console.log("");

    // Step 3: Create 3 Staff Support members (can assign sub-sellers)
    console.log("👥 Step 3: Creating 3 Staff Support members...");
    const staffSupport = [];
    const staffSupportAllocations = [1333, 1333, 1334]; // Total = 4000
    const staffSupportCommissions = [300, 400, 500]; // $3, $4, $5

    for (let i = 0; i < 3; i++) {
      // First 2 staff support members can scan, last one cannot
      const canScan = i < 2;

      const result = await client.mutation(api.staff.mutations.addStaffMember, {
        eventId,
        name: `Staff Support ${i + 1}`,
        email: `staffsupport${i + 1}@test.com`,
        phone: `+123456789${i}`,
        role: "SELLER",
        canScan: canScan,
        allocatedTickets: staffSupportAllocations[i],
        commissionType: "FIXED",
        commissionValue: staffSupportCommissions[i], // in cents
      });

      const staffId = result.staffId;

      // Enable sub-seller assignment permission
      await client.mutation(api.staff.mutations.updateStaffPermissions, {
        staffId,
        canAssignSubSellers: true,
      });

      staffSupport.push({
        id: staffId,
        name: `Staff Support ${i + 1}`,
        allocation: staffSupportAllocations[i],
        commission: staffSupportCommissions[i],
        canScan: canScan,
      });

      const scanStatus = canScan ? "can scan AND sell" : "can sell only";
      console.log(`  ✅ ${staffSupport[i].name}: ${staffSupport[i].allocation} tickets, $${(staffSupport[i].commission / 100).toFixed(2)} commission, ${scanStatus}`);
    }
    console.log("");

    // Step 4: Create 3 Regular Staff members
    console.log("👤 Step 4: Creating 3 Regular Staff members...");

    // Staff 1: Can sell and scan
    const staff1Result = await client.mutation(api.staff.mutations.addStaffMember, {
      eventId,
      name: "Regular Staff 1 (Seller + Scanner)",
      email: "staff1@test.com",
      phone: "+1234567801",
      role: "SELLER",
      canScan: true,
      allocatedTickets: 100,
      commissionType: "FIXED",
      commissionValue: 250, // $2.50
    });
    console.log(`  ✅ Regular Staff 1: 100 tickets, can sell AND scan`);

    // Staff 2: Can sell and scan
    const staff2Result = await client.mutation(api.staff.mutations.addStaffMember, {
      eventId,
      name: "Regular Staff 2 (Seller + Scanner)",
      email: "staff2@test.com",
      phone: "+1234567802",
      role: "SELLER",
      canScan: true,
      allocatedTickets: 100,
      commissionType: "FIXED",
      commissionValue: 275, // $2.75
    });
    console.log(`  ✅ Regular Staff 2: 100 tickets, can sell AND scan`);

    // Staff 3: Can ONLY scan (not sell)
    const staff3Result = await client.mutation(api.staff.mutations.addStaffMember, {
      eventId,
      name: "Regular Staff 3 (Scanner Only)",
      email: "staff3@test.com",
      phone: "+1234567803",
      role: "SCANNER",
      canScan: true, // Scanners can scan by default
      allocatedTickets: 0,
      commissionType: "FIXED",
      commissionValue: 0,
    });
    console.log(`  ✅ Regular Staff 3: 0 tickets, can ONLY scan (cannot sell)`);
    console.log("");

    // Step 5: Create Sub-resellers under each Staff Support
    console.log("🌳 Step 5: Creating Sub-resellers...");
    const subResellerCounts = [2, 3, 4]; // Different amounts for variety

    for (let i = 0; i < staffSupport.length; i++) {
      console.log(`\n  Creating ${subResellerCounts[i]} sub-resellers for ${staffSupport[i].name}:`);
      const parentStaffId = staffSupport[i].id;
      const ticketsPerSubReseller = Math.floor(staffSupport[i].allocation / (subResellerCounts[i] + 1));

      for (let j = 0; j < subResellerCounts[i]; j++) {
        const commissionValue = 200 + (j * 50); // $2.00, $2.50, $3.00, etc.
        const ticketAllocation = ticketsPerSubReseller + (j * 10); // Vary amounts

        const result = await client.mutation(api.staff.mutations.assignSubSellerForTesting, {
          parentStaffId,
          name: `Sub-Reseller ${i + 1}.${j + 1}`,
          email: `subreseller${i + 1}_${j + 1}@test.com`,
          phone: `+12345678${i}${j}`,
          allocatedTickets: ticketAllocation,
          commissionType: "FIXED",
          commissionValue: commissionValue,
        });

        console.log(`    ✅ Sub-Reseller ${i + 1}.${j + 1}: ${ticketAllocation} tickets, $${(commissionValue / 100).toFixed(2)} commission`);
      }
    }
    console.log("");

    // Step 6: Event is already published
    console.log("✅ Event is already published (testing mode)");
    console.log("");

    // Summary
    console.log("📊 SUMMARY");
    console.log("==========");
    console.log(`Event ID: ${eventId}`);
    console.log(`Event Name: Chicago Steppers Social - ${formatDate(eventDate)}`);
    console.log(`Total Tickets: 5,000 @ $25 each`);
    console.log("");
    console.log("Ticket Distribution:");
    console.log(`  • Organizer keeps: 1,000 tickets`);
    console.log(`  • Distributed to staff: 4,000 tickets`);
    console.log("");
    console.log("Staff Structure (6 people):");
    console.log(`  • 3 Staff Support (can assign sub-sellers):`);
    console.log(`    - Staff Support 1: 1,333 tickets, $3 commission, can scan + sell`);
    console.log(`    - Staff Support 2: 1,333 tickets, $4 commission, can scan + sell`);
    console.log(`    - Staff Support 3: 1,334 tickets, $5 commission, can sell only`);
    console.log(`  • 3 Regular Staff:`);
    console.log(`    - Regular Staff 1: 100 tickets, can scan + sell`);
    console.log(`    - Regular Staff 2: 100 tickets, can scan + sell`);
    console.log(`    - Regular Staff 3: 0 tickets, can ONLY scan`);
    console.log("");
    console.log("Sub-resellers:");
    console.log(`  • Staff Support 1: 2 sub-resellers`);
    console.log(`  • Staff Support 2: 3 sub-resellers`);
    console.log(`  • Staff Support 3: 4 sub-resellers`);
    console.log(`  • Total: 9 sub-resellers`);
    console.log("");
    console.log("✅ Staff hierarchy test created successfully!");
    console.log("");
    console.log("🔗 View event at: http://localhost:3000/events/" + eventId);
    console.log("🔗 Or in production: https://events.stepperslife.com/events/" + eventId);

  } catch (error) {
    console.error("❌ Error creating staff hierarchy test:", error);
    throw error;
  }
}

// Run the script
createStaffHierarchyTest()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
