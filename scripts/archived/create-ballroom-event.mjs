import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function createBallroomEvent() {
  console.log("🎭 Creating Ballroom Event with 200 capacity...\n");

  try {
    // Get the admin user by email
    const adminUser = await client.query(api.users.queries.getUserByEmail, {
      email: "iradwatkins@gmail.com"
    });

    if (!adminUser) {
      console.error("❌ Admin user not found. Please run: node scripts/seed-admin.mjs");
      return;
    }

    console.log(`✅ Using admin user: ${adminUser.email}`);

    // Create the event
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 30); // 30 days from now

    const eventData = {
      name: "Grand Ballroom Gala",
      description: "An elegant evening featuring VIP and regular seating with round tables. Experience luxury dining and entertainment in our grand ballroom.",
      categories: ["Gala", "Ballroom", "Formal"],
      startDate: eventDate.getTime(),
      endDate: eventDate.getTime() + (4 * 60 * 60 * 1000), // 4 hours later
      timezone: "America/Los_Angeles",
      eventDateLiteral: eventDate.toLocaleDateString(),
      eventTimeLiteral: "7:00 PM",
      eventTimezone: "PST",
      location: {
        venueName: "Grand Ballroom Convention Center",
        address: "123 Gala Avenue",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90001",
        country: "United States"
      },
      eventType: "TICKETED_EVENT",
      capacity: 200,
    };

    console.log("\n📋 Creating event...");
    const eventId = await client.mutation(api.events.mutations.createEvent, eventData);
    console.log(`✅ Event created: ${eventId}`);

    // Create ticket tiers
    console.log("\n🎫 Creating ticket tiers...");

    // VIP Tier - 30 tickets (3 tables × 10 seats)
    const vipTierId = await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "VIP Table Seating",
      description: "Premium seating at VIP tables with exclusive service and amenities",
      price: 10000, // $100 in cents
      quantity: 30,
      saleStart: Date.now(),
      saleEnd: eventDate.getTime(),
    });
    console.log(`✅ VIP Tier created: ${vipTierId} - $100 × 30 tickets`);

    // Regular Tier - 170 tickets (17 tables × 10 seats)
    const regularTierId = await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "General Admission",
      description: "Standard seating at round tables with full access to the event",
      price: 5000, // $50 in cents
      quantity: 170,
      saleStart: Date.now(),
      saleEnd: eventDate.getTime(),
    });
    console.log(`✅ Regular Tier created: ${regularTierId} - $50 × 170 tickets`);

    // Create ballroom seating chart with round tables
    console.log("\n🪑 Creating ballroom seating chart...");

    const sections = [];
    const tables = [];

    // VIP Section - 3 tables (Tables 1-3)
    console.log("  Creating VIP tables (1-3)...");
    for (let i = 1; i <= 3; i++) {
      const table = {
        id: `vip-table-${i}`,
        number: i,
        shape: "ROUND",
        x: 100 + ((i - 1) * 200), // Spread horizontally
        y: 100,
        width: 120,
        height: 120,
        capacity: 10,
        seats: []
      };

      // Create 10 seats around the table
      for (let seatNum = 1; seatNum <= 10; seatNum++) {
        table.seats.push({
          id: `vip-table-${i}-seat-${seatNum}`,
          number: `${seatNum}`,
          type: "VIP",
          status: "AVAILABLE",
        });
      }

      tables.push(table);
    }

    // Regular Section - 17 tables (Tables 4-20)
    console.log("  Creating Regular tables (4-20)...");
    let tableNum = 4;
    for (let row = 0; row < 4; row++) { // 4 rows
      for (let col = 0; col < 5; col++) { // 5 columns (max)
        if (tableNum > 20) break;

        const table = {
          id: `regular-table-${tableNum}`,
          number: tableNum,
          shape: "ROUND",
          x: 100 + (col * 200),
          y: 300 + (row * 200), // Below VIP section
          width: 120,
          height: 120,
          capacity: 10,
          seats: []
        };

        // Create 10 seats around the table
        for (let seatNum = 1; seatNum <= 10; seatNum++) {
          table.seats.push({
            id: `regular-table-${tableNum}-seat-${seatNum}`,
            number: `${seatNum}`,
            type: "STANDARD",
            status: "AVAILABLE",
          });
        }

        tables.push(table);
        tableNum++;
      }
    }

    // Create VIP section (Tables 1-3)
    sections.push({
      id: "vip-section",
      name: "VIP Section",
      containerType: "TABLES",
      color: "#FFD700", // Gold color for VIP
      ticketTierId: vipTierId, // Link to VIP tier pricing
      tables: tables.filter(t => t.id.startsWith("vip-"))
    });

    // Create General Admission section (Tables 4-20)
    sections.push({
      id: "general-section",
      name: "General Admission",
      containerType: "TABLES",
      color: "#3B82F6", // Blue color
      ticketTierId: regularTierId, // Link to regular tier pricing
      tables: tables.filter(t => t.id.startsWith("regular-"))
    });

    const seatingChartId = await client.mutation(api.seating.mutations.createSeatingChart, {
      eventId,
      name: "Main Ballroom Layout",
      seatingStyle: "TABLE_BASED",
      sections: sections,
    });

    console.log(`✅ Seating chart created: ${seatingChartId}`);
    console.log(`   - 2 sections with tier pricing`);
    console.log(`   - VIP Section: 3 tables (Tables 1-3) @ $100/seat`);
    console.log(`   - General Section: 17 tables (Tables 4-20) @ $50/seat`);
    console.log(`   - Total: 20 round tables, 200 seats`);

    console.log("\n✨ Event Creation Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Event Name: Grand Ballroom Gala`);
    console.log(`Event ID: ${eventId}`);
    console.log(`Date: ${eventDate.toLocaleDateString()}`);
    console.log(`Capacity: 200 people`);
    console.log(`Tables: 20 round tables (10 seats each)`);
    console.log(`\nTicket Tiers:`);
    console.log(`  • VIP: $100 × 30 tickets (3 tables)`);
    console.log(`  • General: $50 × 170 tickets (17 tables)`);
    console.log(`\n🌐 View Event:`);
    console.log(`https://events.stepperslife.com/events/${eventId}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  }
}

createBallroomEvent();
