import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

// Helper to generate random number between min and max
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("🎪 CREATING HIERARCHY TEST EVENT");
  console.log("==========================================\n");

  try {
    // Step 1: Find and delete existing test event
    console.log("🗑️  Step 1: Removing old test event...");
    const TEST_EVENT_ID = "jh75kydzxb2xb1jj2rwnq1q8f97tvqfa";

    try {
      const existingEvent = await client.query(api.events.queries.getEventById, {
        eventId: TEST_EVENT_ID,
      });

      if (existingEvent) {
        console.log(`   Found event: ${existingEvent.name}`);
        console.log(`   Deleting event and all associated data...`);

        // Note: We'll need to manually delete via Convex dashboard or create a deletion mutation
        // For now, let's proceed with creating the new event
        console.log(`   ⚠️  Please manually delete event ${TEST_EVENT_ID} from Convex dashboard`);
      }
    } catch (error) {
      console.log(`   Event not found or already deleted`);
    }

    console.log("\n");

    // Step 2: Create new test event
    console.log("🎫 Step 2: Creating new test event...");

    const eventData = {
      name: "Staff Hierarchy Test Event 2024",
      description: "Test event for staff hierarchy and commission tracking with Team Members → Associates flow",
      startDate: new Date("2024-12-31T20:00:00").getTime(),
      endDate: new Date("2025-01-01T03:00:00").getTime(),
      location: "Test Venue - 123 Main St",
      maxCapacity: 5000,
      timezone: "America/New_York",
      status: "published",
    };

    console.log(`   Creating: ${eventData.name}`);
    console.log(`   Total Capacity: ${eventData.maxCapacity} tickets\n`);

    // Note: We need to be authenticated as an organizer to create events
    // This script will need to be run with proper auth or via internal mutation
    console.log("   ⚠️  This script needs organizer authentication");
    console.log("   ⚠️  Please run the following steps manually:\n");

    console.log("📋 MANUAL STEPS:");
    console.log("================\n");

    console.log("1. CREATE EVENT:");
    console.log(`   - Name: ${eventData.name}`);
    console.log(`   - Description: ${eventData.description}`);
    console.log(`   - Capacity: 5000 tickets`);
    console.log(`   - Date: Dec 31, 2024 8:00 PM - Jan 1, 2025 3:00 AM\n`);

    console.log("2. CREATE TICKET TIER:");
    console.log(`   - Name: General Admission`);
    console.log(`   - Price: $25.00`);
    console.log(`   - Quantity: 5000\n`);

    console.log("3. ADD STAFF (No tickets initially):");
    console.log(`   - Role: STAFF (Door Staff)`);
    console.log(`   - Name: Door Scanner 1`);
    console.log(`   - Email: scanner1@test.com`);
    console.log(`   - Allocated: 0 tickets`);
    console.log(`   - Can Scan: Yes\n`);

    console.log("4. ADD TEAM MEMBERS (They get tickets from organizer):");
    const teamMembers = [
      { name: "Team Member Alpha", email: "team.alpha@test.com", tickets: randomBetween(800, 1200) },
      { name: "Team Member Beta", email: "team.beta@test.com", tickets: randomBetween(800, 1200) },
      { name: "Team Member Gamma", email: "team.gamma@test.com", tickets: randomBetween(600, 1000) },
      { name: "Team Member Delta", email: "team.delta@test.com", tickets: randomBetween(600, 1000) },
    ];

    let totalAllocatedToTeamMembers = 0;
    teamMembers.forEach((tm, idx) => {
      console.log(`   ${idx + 1}. ${tm.name}`);
      console.log(`      - Email: ${tm.email}`);
      console.log(`      - Role: TEAM_MEMBERS`);
      console.log(`      - Allocated: ${tm.tickets} tickets`);
      console.log(`      - Commission: Fixed $3.00`);
      console.log(`      - Can Assign Associates: Yes\n`);
      totalAllocatedToTeamMembers += tm.tickets;
    });

    console.log(`   Total allocated to Team Members: ${totalAllocatedToTeamMembers} tickets\n`);

    console.log("5. TEAM MEMBERS ASSIGN ASSOCIATES (They give tickets to associates):");

    // Team Member Alpha assigns 3 associates
    const alphaAssociates = [
      { name: "Associate Alpha-1", email: "assoc.alpha1@test.com", tickets: randomBetween(100, 200) },
      { name: "Associate Alpha-2", email: "assoc.alpha2@test.com", tickets: randomBetween(100, 200) },
      { name: "Associate Alpha-3", email: "assoc.alpha3@test.com", tickets: randomBetween(50, 150) },
    ];

    console.log(`   Team Member Alpha assigns:`);
    let alphaTotal = 0;
    alphaAssociates.forEach((assoc, idx) => {
      console.log(`      ${idx + 1}. ${assoc.name}`);
      console.log(`         - Email: ${assoc.email}`);
      console.log(`         - Role: ASSOCIATES`);
      console.log(`         - Allocated: ${assoc.tickets} tickets`);
      console.log(`         - Commission: Fixed $2.00`);
      alphaTotal += assoc.tickets;
    });
    console.log(`   Subtotal: ${alphaTotal} tickets\n`);

    // Team Member Beta assigns 2 associates
    const betaAssociates = [
      { name: "Associate Beta-1", email: "assoc.beta1@test.com", tickets: randomBetween(150, 250) },
      { name: "Associate Beta-2", email: "assoc.beta2@test.com", tickets: randomBetween(100, 200) },
    ];

    console.log(`   Team Member Beta assigns:`);
    let betaTotal = 0;
    betaAssociates.forEach((assoc, idx) => {
      console.log(`      ${idx + 1}. ${assoc.name}`);
      console.log(`         - Email: ${assoc.email}`);
      console.log(`         - Role: ASSOCIATES`);
      console.log(`         - Allocated: ${assoc.tickets} tickets`);
      console.log(`         - Commission: Fixed $2.50`);
      betaTotal += assoc.tickets;
    });
    console.log(`   Subtotal: ${betaTotal} tickets\n`);

    // Team Member Gamma assigns 4 associates
    const gammaAssociates = [
      { name: "Associate Gamma-1", email: "assoc.gamma1@test.com", tickets: randomBetween(80, 120) },
      { name: "Associate Gamma-2", email: "assoc.gamma2@test.com", tickets: randomBetween(80, 120) },
      { name: "Associate Gamma-3", email: "assoc.gamma3@test.com", tickets: randomBetween(80, 120) },
      { name: "Associate Gamma-4", email: "assoc.gamma4@test.com", tickets: randomBetween(60, 100) },
    ];

    console.log(`   Team Member Gamma assigns:`);
    let gammaTotal = 0;
    gammaAssociates.forEach((assoc, idx) => {
      console.log(`      ${idx + 1}. ${assoc.name}`);
      console.log(`         - Email: ${assoc.email}`);
      console.log(`         - Role: ASSOCIATES`);
      console.log(`         - Allocated: ${assoc.tickets} tickets`);
      console.log(`         - Commission: Fixed $2.00`);
      gammaTotal += assoc.tickets;
    });
    console.log(`   Subtotal: ${gammaTotal} tickets\n`);

    // Team Member Delta assigns 2 associates
    const deltaAssociates = [
      { name: "Associate Delta-1", email: "assoc.delta1@test.com", tickets: randomBetween(100, 200) },
      { name: "Associate Delta-2", email: "assoc.delta2@test.com", tickets: randomBetween(100, 200) },
    ];

    console.log(`   Team Member Delta assigns:`);
    let deltaTotal = 0;
    deltaAssociates.forEach((assoc, idx) => {
      console.log(`      ${idx + 1}. ${assoc.name}`);
      console.log(`         - Email: ${assoc.email}`);
      console.log(`         - Role: ASSOCIATES`);
      console.log(`         - Allocated: ${assoc.tickets} tickets`);
      console.log(`         - Commission: Fixed $2.25`);
      deltaTotal += assoc.tickets;
    });
    console.log(`   Subtotal: ${deltaTotal} tickets\n`);

    const totalAllocatedToAssociates = alphaTotal + betaTotal + gammaTotal + deltaTotal;

    console.log("\n📊 SUMMARY:");
    console.log("===========");
    console.log(`Total Event Capacity: 5000 tickets`);
    console.log(`\nOrganizer's Pool: ${5000 - totalAllocatedToTeamMembers} tickets`);
    console.log(`\nStaff (Door):`);
    console.log(`  - 1 Staff member: 0 tickets (scanning only)`);
    console.log(`\nTeam Members: ${totalAllocatedToTeamMembers} tickets distributed to:`);
    console.log(`  - Team Member Alpha: ${teamMembers[0].tickets} tickets (gave ${alphaTotal} to associates)`);
    console.log(`  - Team Member Beta: ${teamMembers[1].tickets} tickets (gave ${betaTotal} to associates)`);
    console.log(`  - Team Member Gamma: ${teamMembers[2].tickets} tickets (gave ${gammaTotal} to associates)`);
    console.log(`  - Team Member Delta: ${teamMembers[3].tickets} tickets (gave ${deltaTotal} to associates)`);
    console.log(`\nAssociates: ${totalAllocatedToAssociates} tickets total`);
    console.log(`  - Alpha's Associates: ${alphaAssociates.length} people, ${alphaTotal} tickets`);
    console.log(`  - Beta's Associates: ${betaAssociates.length} people, ${betaTotal} tickets`);
    console.log(`  - Gamma's Associates: ${gammaAssociates.length} people, ${gammaTotal} tickets`);
    console.log(`  - Delta's Associates: ${deltaAssociates.length} people, ${deltaTotal} tickets`);

    console.log(`\n✅ HIERARCHY STRUCTURE:`);
    console.log(`   Organizer (5000 tickets)`);
    console.log(`   ├── Team Member Alpha (${teamMembers[0].tickets} tickets)`);
    console.log(`   │   ├── Associate Alpha-1 (${alphaAssociates[0].tickets} tickets)`);
    console.log(`   │   ├── Associate Alpha-2 (${alphaAssociates[1].tickets} tickets)`);
    console.log(`   │   └── Associate Alpha-3 (${alphaAssociates[2].tickets} tickets)`);
    console.log(`   ├── Team Member Beta (${teamMembers[1].tickets} tickets)`);
    console.log(`   │   ├── Associate Beta-1 (${betaAssociates[0].tickets} tickets)`);
    console.log(`   │   └── Associate Beta-2 (${betaAssociates[1].tickets} tickets)`);
    console.log(`   ├── Team Member Gamma (${teamMembers[2].tickets} tickets)`);
    console.log(`   │   ├── Associate Gamma-1 (${gammaAssociates[0].tickets} tickets)`);
    console.log(`   │   ├── Associate Gamma-2 (${gammaAssociates[1].tickets} tickets)`);
    console.log(`   │   ├── Associate Gamma-3 (${gammaAssociates[2].tickets} tickets)`);
    console.log(`   │   └── Associate Gamma-4 (${gammaAssociates[3].tickets} tickets)`);
    console.log(`   ├── Team Member Delta (${teamMembers[3].tickets} tickets)`);
    console.log(`   │   ├── Associate Delta-1 (${deltaAssociates[0].tickets} tickets)`);
    console.log(`   │   └── Associate Delta-2 (${deltaAssociates[1].tickets} tickets)`);
    console.log(`   └── Staff (Door Scanner) (0 tickets, scanning only)\n`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  }

  process.exit(0);
}

main();
