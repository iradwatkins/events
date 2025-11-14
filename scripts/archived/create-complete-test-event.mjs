import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import crypto from "crypto";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

// Test password for all accounts
const TEST_PASSWORD = "TestPass123!";
const PASSWORD_HASH = "$2b$10$xQZ5YxZ5YxZ5YxZ5YxZ5YeXQZ5YxZ5YxZ5YxZ5YxZ5YxZ5YxZ5Y"; // Placeholder hash

const ORGANIZER_EMAIL = "ira@irawatkins.com";

// Staff accounts to create
const STAFF_ACCOUNTS = {
  teamMembers: [
    { name: "Marcus Johnson", email: "marcus@example.com", phone: "+1-312-555-0101", allocation: 100 },
    { name: "Tanya Williams", email: "tanya@example.com", phone: "+1-312-555-0102", allocation: 80 },
    { name: "Derek Brown", email: "derek@example.com", phone: "+1-312-555-0103", allocation: 60 }
  ],
  scanners: [
    { name: "Sarah Scanner", email: "sarah.scanner@example.com", phone: "+1-312-555-0201" },
    { name: "Mike Scanner", email: "mike.scanner@example.com", phone: "+1-312-555-0202" }
  ],
  associates: [
    { name: "Jessica Lee", email: "jessica@example.com", phone: "+1-312-555-0301", parentIndex: 0, allocation: 40 },
    { name: "Kevin Torres", email: "kevin@example.com", phone: "+1-312-555-0302", parentIndex: 1, allocation: 30 },
    { name: "Amanda Chen", email: "amanda@example.com", phone: "+1-312-555-0303", parentIndex: 2, allocation: 20 }
  ]
};

// CRM contacts
const CRM_CONTACTS = [
  {
    name: "DJ Smooth Stepz",
    phoneNumber: "+1-312-555-1001",
    email: "djsmoothstepz@example.com",
    role: "DJ/Entertainment",
    socialMedia: { instagram: "@djsmoothstepz", facebook: "DJSmoothStepz" },
    notes: "House DJ, plays every Saturday"
  },
  {
    name: "Elite Event Photography",
    phoneNumber: "+1-312-555-1002",
    email: "info@eliteeventphoto.com",
    role: "Photographer",
    organization: "Elite Event Photography LLC",
    notes: "Professional event photography service"
  },
  {
    name: "Jennifer Martinez",
    phoneNumber: "+1-312-555-1003",
    email: "jennifer@grandballroom.com",
    role: "Venue Coordinator",
    organization: "Grand Ballroom Chicago",
    notes: "Main point of contact for venue"
  },
  {
    name: "Chicago Steppers Network",
    phoneNumber: "+1-312-555-1004",
    email: "info@chisteppersnet.com",
    role: "Promoter",
    organization: "Chicago Steppers Network",
    socialMedia: { instagram: "@chisteppers", facebook: "ChicagoSteppersNetwork" },
    notes: "Community organization, 5000+ members"
  },
  {
    name: "Taste of Chicago Catering",
    phoneNumber: "+1-312-555-1005",
    email: "events@tasteofchicago.com",
    role: "Catering",
    organization: "Taste of Chicago Catering Co.",
    notes: "Full-service catering, $25/person"
  },
  {
    name: "SecureGuard Services",
    phoneNumber: "+1-312-555-1006",
    email: "booking@secureguard.com",
    role: "Security",
    organization: "SecureGuard Event Security",
    notes: "8 security personnel confirmed"
  },
  {
    name: "Elegant Events by Sophia",
    phoneNumber: "+1-312-555-1007",
    email: "sophia@eleganteventschi.com",
    role: "Decorator",
    organization: "Elegant Events Design",
    socialMedia: { instagram: "@eleganteventschi" },
    notes: "Event decorator, floral arrangements"
  },
  {
    name: "Marcus Sound & Lighting",
    phoneNumber: "+1-312-555-1008",
    email: "marcus@marcussound.com",
    role: "Sound Engineer",
    organization: "Marcus Sound & Lighting",
    notes: "Professional sound system setup"
  },
  {
    name: "Windy City Beverages",
    phoneNumber: "+1-312-555-1009",
    email: "sponsor@windycitybev.com",
    role: "Sponsor",
    organization: "Windy City Beverages",
    notes: "Beverage sponsor, $2000 contribution"
  },
  {
    name: "Chicago Dance Association",
    phoneNumber: "+1-312-555-1010",
    email: "partnership@chidance.org",
    role: "Partner Organization",
    organization: "Chicago Dance Association",
    notes: "Co-promoting event to members"
  }
];

console.log("🎉 CREATING COMPLETE TEST EVENT ECOSYSTEM\n");
console.log("=" .repeat(80));

async function createCompleteTestEvent() {
  const results = {
    event: null,
    ticketTiers: [],
    staff: {
      teamMembers: [],
      scanners: [],
      associates: []
    },
    crmContacts: [],
    orders: [],
    loginCredentials: []
  };

  try {
    // Step 1: Create the event
    console.log("\n📅 STEP 1: Creating Event...");

    const eventData = {
      name: "SteppersLife Spring Gala 2025",
      eventType: "TICKETED_EVENT",
      description: "Join us for an unforgettable night of stepping, music, and celebration at Chicago's premier Spring Gala. Featuring DJ Smooth Stepz, professional photography, elegant décor, and VIP table service. This is THE stepping event of the season!",
      categories: ["stepping", "gala", "nightlife", "dance"],

      // Timestamps
      startDate: new Date("2025-03-15T20:00:00-05:00").getTime(),
      endDate: new Date("2025-03-16T02:00:00-05:00").getTime(),
      timezone: "America/Chicago",

      // Literal display fields
      eventDateLiteral: "Saturday, March 15, 2025",
      eventTimeLiteral: "8:00 PM - 2:00 AM",
      eventTimezone: "Central Time (CT)",

      // Location
      location: {
        venueName: "Grand Ballroom Chicago",
        address: "123 Michigan Avenue",
        city: "Chicago",
        state: "Illinois",
        zipCode: "60601",
        country: "United States"
      },

      capacity: 500,
      doorPrice: "$40"
    };

    results.event = await client.mutation(api.events.mutations.createEvent, eventData);
    console.log(`✅ Event created: ${results.event}`);
    console.log(`   Event ID: ${results.event}`);

    // Step 2: Create ticket tiers
    console.log("\n🎫 STEP 2: Creating Ticket Tiers...");

    const now = Date.now();
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
    const twentyOneDaysFromNow = now + (21 * 24 * 60 * 60 * 1000);
    const fourteenDaysFromNow = now + (14 * 24 * 60 * 60 * 1000);

    // Tier 1: Early Bird General Admission (100 tickets)
    const tier1 = await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId: results.event,
      name: "General Admission",
      description: "Standard entry with dance floor access",
      price: 3000, // $30 regular price
      quantity: 100,
      pricingTiers: [
        {
          name: "Early Bird Special",
          price: 2500,
          availableFrom: now,
          availableUntil: sevenDaysFromNow
        },
        {
          name: "Regular Price",
          price: 3000,
          availableFrom: sevenDaysFromNow
        }
      ]
    });
    results.ticketTiers.push({ id: tier1, name: "General Admission", quantity: 100 });
    console.log(`✅ Created: General Admission (100 tickets, $25-$30)`);

    // Tier 2: VIP Individual (50 tickets)
    const tier2 = await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId: results.event,
      name: "VIP Individual",
      description: "VIP section access, complimentary drink, priority entry",
      price: 7500, // $75 regular
      quantity: 50,
      pricingTiers: [
        {
          name: "Early Bird VIP",
          price: 6000,
          availableFrom: now,
          availableUntil: fourteenDaysFromNow
        },
        {
          name: "Regular VIP Price",
          price: 7500,
          availableFrom: fourteenDaysFromNow
        }
      ]
    });
    results.ticketTiers.push({ id: tier2, name: "VIP Individual", quantity: 50 });
    console.log(`✅ Created: VIP Individual (50 tickets, $60-$75)`);

    // Tier 3: VIP Table 8-seater (10 tables = 80 seats)
    const tier3 = await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId: results.event,
      name: "VIP Table (8 seats)",
      description: "Reserved VIP table for 8 guests, bottle service, dedicated server",
      price: 50000, // $500 per table
      quantity: 10,
      isTablePackage: true,
      tableCapacity: 8
    });
    results.ticketTiers.push({ id: tier3, name: "VIP Table (8 seats)", quantity: 10, isTable: true, capacity: 8 });
    console.log(`✅ Created: VIP Table 8-seater (10 tables = 80 seats, $500/table)`);

    // Tier 4: Premium Table 10-seater (5 tables = 50 seats)
    const tier4 = await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId: results.event,
      name: "Premium Table (10 seats)",
      description: "Premium reserved table for 10 guests, premium bottle service, VIP parking",
      price: 80000, // $800 per table
      quantity: 5,
      isTablePackage: true,
      tableCapacity: 10
    });
    results.ticketTiers.push({ id: tier4, name: "Premium Table (10 seats)", quantity: 5, isTable: true, capacity: 10 });
    console.log(`✅ Created: Premium Table 10-seater (5 tables = 50 seats, $800/table)`);

    // Tier 5: Door Price (20 tickets)
    const tier5 = await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId: results.event,
      name: "Door Price",
      description: "At-the-door general admission (if available)",
      price: 4000, // $40
      quantity: 20,
      saleStart: new Date("2025-03-15T19:00:00-05:00").getTime() // 1 hour before event
    });
    results.ticketTiers.push({ id: tier5, name: "Door Price", quantity: 20 });
    console.log(`✅ Created: Door Price (20 tickets, $40)`);

    console.log(`\n   Total ticket capacity: 300 tickets`);
    console.log(`   (100 GA + 50 VIP + 80 VIP Table + 50 Premium Table + 20 Door)`);

    // Step 3: Payment configuration will be set up via testing helper after staff creation
    console.log("\n💳 STEP 3: Skipping payment config (will use enableTicketsForTesting later)...");

    // Step 4: Create staff members
    console.log("\n👥 STEP 4: Creating Staff Members...");

    // Create Team Members
    console.log("\n   Creating Team Members (Top-tier sellers)...");
    for (const member of STAFF_ACCOUNTS.teamMembers) {
      const staffId = await client.mutation(api.staff.mutations.addStaffMember, {
        eventId: results.event,
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: "SELLER",
        canScan: true,
        commissionType: "PERCENTAGE",
        commissionValue: 10
      });

      results.staff.teamMembers.push({
        id: staffId,
        name: member.name,
        email: member.email,
        allocation: member.allocation
      });

      console.log(`   ✅ ${member.name} (${member.email}) - Team Member`);
    }

    // Create Scanners
    console.log("\n   Creating Scanners...");
    for (const scanner of STAFF_ACCOUNTS.scanners) {
      const staffId = await client.mutation(api.staff.mutations.addStaffMember, {
        eventId: results.event,
        name: scanner.name,
        email: scanner.email,
        phone: scanner.phone,
        role: "SCANNER",
        canScan: true
      });

      results.staff.scanners.push({
        id: staffId,
        name: scanner.name,
        email: scanner.email
      });

      console.log(`   ✅ ${scanner.name} (${scanner.email}) - Scanner`);
    }

    // Create Associates (sub-sellers) - using SELLER role with assigned parent
    console.log("\n   Creating Associates (Sub-sellers)...");
    for (const associate of STAFF_ACCOUNTS.associates) {
      const parentStaff = results.staff.teamMembers[associate.parentIndex];

      const staffId = await client.mutation(api.staff.mutations.addStaffMember, {
        eventId: results.event,
        name: associate.name,
        email: associate.email,
        phone: associate.phone,
        role: "SELLER",
        assignedByStaffId: parentStaff.id,
        commissionType: "PERCENTAGE",
        commissionValue: 8
      });

      results.staff.associates.push({
        id: staffId,
        name: associate.name,
        email: associate.email,
        parent: parentStaff.name,
        allocation: associate.allocation
      });

      console.log(`   ✅ ${associate.name} (${associate.email}) - Associate under ${parentStaff.name}`);
    }

    // Step 5: Allocate tiers to Team Members
    console.log("\n🎯 STEP 5: Allocating Ticket Tiers to Staff...");

    // Allocate GA tickets to Team Members
    for (let i = 0; i < results.staff.teamMembers.length; i++) {
      const member = results.staff.teamMembers[i];
      const allocation = STAFF_ACCOUNTS.teamMembers[i].allocation;

      // Split allocation across GA and VIP
      const gaAllocation = Math.floor(allocation * 0.7);
      const vipAllocation = allocation - gaAllocation;

      await client.mutation(api.staff.tierAllocations.allocateTierToStaff, {
        staffId: member.id,
        tierId: tier1,
        quantity: gaAllocation
      });

      await client.mutation(api.staff.tierAllocations.allocateTierToStaff, {
        staffId: member.id,
        tierId: tier2,
        quantity: vipAllocation
      });

      console.log(`   ✅ ${member.name}: ${gaAllocation} GA + ${vipAllocation} VIP`);
    }

    // Step 6: Create CRM contacts
    console.log("\n📇 STEP 6: Creating CRM Contacts...");

    for (const contact of CRM_CONTACTS) {
      const contactId = await client.mutation(api.crm.mutations.createContact, {
        ...contact,
        eventId: results.event,
        extractedFrom: "MANUAL"
      });

      results.crmContacts.push({
        id: contactId,
        name: contact.name,
        role: contact.role
      });

      console.log(`   ✅ ${contact.name} - ${contact.role}`);
    }

    // Step 7: Create orders (299 tickets)
    console.log("\n🛒 STEP 7: Generating 299 Test Orders...");
    console.log("   This will use 299 of 300 credits, leaving 1 credit remaining\n");

    const salesPlan = [
      { type: "online", tier: tier1, quantity: 80, label: "Online GA Sales" },
      { type: "online", tier: tier2, quantity: 20, label: "Online VIP Sales" },
      { type: "staff", staffIndex: 0, tier: tier1, quantity: 40, label: "Marcus - GA" },
      { type: "staff", staffIndex: 0, tier: tier2, quantity: 20, label: "Marcus - VIP" },
      { type: "staff", staffIndex: 1, tier: tier1, quantity: 35, label: "Tanya - GA" },
      { type: "staff", staffIndex: 1, tier: tier2, quantity: 15, label: "Tanya - VIP" },
      { type: "staff", staffIndex: 2, tier: tier1, quantity: 20, label: "Derek - GA" },
      { type: "staff", staffIndex: 2, tier: tier2, quantity: 10, label: "Derek - VIP" },
      { type: "associate", staffIndex: 0, tier: tier1, quantity: 25, label: "Jessica - GA" },
      { type: "associate", staffIndex: 1, tier: tier1, quantity: 20, label: "Kevin - GA" },
      { type: "associate", staffIndex: 2, tier: tier1, quantity: 14, label: "Amanda - GA" }
    ];

    let totalSold = 0;

    for (const sale of salesPlan) {
      const tierInfo = results.ticketTiers.find(t => t.id === sale.tier);

      if (sale.type === "online") {
        // Create online order
        const order = await client.mutation(api.orders.mutations.createOrder, {
          eventId: results.event,
          ticketTierId: sale.tier,
          quantity: sale.quantity,
          buyerEmail: `buyer${totalSold}@example.com`,
          buyerName: `Test Buyer ${totalSold}`,
          subtotalCents: tierInfo.isTable ? 50000 * sale.quantity : 3000 * sale.quantity,
          platformFeeCents: 0,
          processingFeeCents: 0,
          totalCents: tierInfo.isTable ? 50000 * sale.quantity : 3000 * sale.quantity
        });

        // Complete the order
        await client.mutation(api.orders.mutations.completeOrder, {
          orderId: order,
          paymentId: `test_${Date.now()}_${totalSold}`,
          paymentMethod: "TEST"
        });

        results.orders.push({ orderId: order, type: "online", quantity: sale.quantity });
        totalSold += sale.quantity;
        console.log(`   ✅ ${sale.label}: ${sale.quantity} tickets (Total: ${totalSold})`);
      }
      else if (sale.type === "staff") {
        const staff = results.staff.teamMembers[sale.staffIndex];

        // Create cash sale
        await client.mutation(api.staff.cashSales.createCashSale, {
          staffId: staff.id,
          eventId: results.event,
          tierId: sale.tier,
          quantity: sale.quantity,
          buyerName: `Staff Sale ${totalSold}`,
          buyerEmail: `staffsale${totalSold}@example.com`,
          paymentMethod: "CASH"
        });

        totalSold += sale.quantity;
        console.log(`   ✅ ${sale.label}: ${sale.quantity} tickets (Total: ${totalSold})`);
      }
      else if (sale.type === "associate") {
        const associate = results.staff.associates[sale.staffIndex];

        // Create cash sale by associate
        await client.mutation(api.staff.cashSales.createCashSale, {
          staffId: associate.id,
          eventId: results.event,
          tierId: sale.tier,
          quantity: sale.quantity,
          buyerName: `Associate Sale ${totalSold}`,
          buyerEmail: `associatesale${totalSold}@example.com`,
          paymentMethod: "CASH_APP"
        });

        totalSold += sale.quantity;
        console.log(`   ✅ ${sale.label}: ${sale.quantity} tickets (Total: ${totalSold})`);
      }
    }

    console.log(`\n   📊 Total tickets sold: ${totalSold}/299`);
    console.log(`   💳 Credits used: 299/300 (1 credit remaining)`);

    // Step 8: Generate login credentials
    console.log("\n🔑 STEP 8: Generating Login Credentials...");

    results.loginCredentials = [
      {
        role: "Event Organizer",
        name: "Ira Watkins",
        email: ORGANIZER_EMAIL,
        password: TEST_PASSWORD,
        notes: "Can manage entire event, view all sales"
      },
      ...results.staff.teamMembers.map(tm => ({
        role: "Team Member (Top-tier Seller)",
        name: tm.name,
        email: tm.email,
        password: TEST_PASSWORD,
        notes: `Can sell tickets, assign sub-sellers, scan tickets`
      })),
      ...results.staff.scanners.map(s => ({
        role: "Scanner (Staff)",
        name: s.name,
        email: s.email,
        password: TEST_PASSWORD,
        notes: "Can only scan tickets at door"
      })),
      ...results.staff.associates.map(a => ({
        role: "Associate (Sub-seller)",
        name: a.name,
        email: a.email,
        password: TEST_PASSWORD,
        notes: `Sub-seller under ${a.parent}, can sell allocated tickets`
      }))
    ];

    return results;

  } catch (error) {
    console.error("\n❌ Error creating test event:", error);
    throw error;
  }
}

// Run the script
createCompleteTestEvent()
  .then((results) => {
    console.log("\n" + "=".repeat(80));
    console.log("✅ COMPLETE TEST EVENT CREATED SUCCESSFULLY!");
    console.log("=".repeat(80));

    console.log("\n📋 EVENT SUMMARY");
    console.log("-".repeat(80));
    console.log(`Event: SteppersLife Spring Gala 2025`);
    console.log(`Event ID: ${results.event}`);
    console.log(`Capacity: 500 people`);
    console.log(`Ticket Tiers: ${results.ticketTiers.length}`);
    console.log(`Staff Members: ${results.staff.teamMembers.length + results.staff.scanners.length + results.staff.associates.length}`);
    console.log(`CRM Contacts: ${results.crmContacts.length}`);
    console.log(`Orders Created: ${results.orders.length}`);
    console.log(`Credits Remaining: 1/300`);

    console.log("\n🔑 LOGIN CREDENTIALS");
    console.log("=".repeat(80));
    console.log(`All accounts use password: ${TEST_PASSWORD}\n`);

    results.loginCredentials.forEach(cred => {
      console.log(`${cred.role}:`);
      console.log(`   Name: ${cred.name}`);
      console.log(`   Email: ${cred.email}`);
      console.log(`   Password: ${cred.password}`);
      console.log(`   Notes: ${cred.notes}\n`);
    });

    console.log("=".repeat(80));
    console.log("🎉 You can now login and test all features!");
    console.log("=".repeat(80));

    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
