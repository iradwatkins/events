#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

/**
 * Script to create a table-based seating chart
 * Usage: node scripts/create-table-seating.mjs <eventId>
 */

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable not set");
  process.exit(1);
}

const eventId = process.argv[2];

if (!eventId) {
  console.error("❌ Error: Please provide an eventId as argument");
  console.log("Usage: node scripts/create-table-seating.mjs <eventId>");
  process.exit(1);
}

/**
 * Generate seats positioned around a table
 * @param {number} capacity - Number of seats
 * @param {string} tableId - Table ID
 * @param {string} shape - Table shape (ROUND, RECTANGULAR, etc.)
 * @returns {Array} Array of seat objects
 */
function generateSeats(capacity, tableId, shape = "ROUND") {
  const seats = [];

  for (let i = 0; i < capacity; i++) {
    const seatNumber = (i + 1).toString();
    const seat = {
      id: `${tableId}-seat-${seatNumber}`,
      number: seatNumber,
      type: "STANDARD",
      status: "AVAILABLE",
      position: {}
    };

    if (shape === "ROUND") {
      // Position seats evenly around circle (0°, 90°, 180°, 270° for 4 seats)
      seat.position.angle = (360 / capacity) * i;
      seat.position.offset = 50; // Distance from table center
    } else if (shape === "RECTANGULAR" || shape === "SQUARE") {
      // Position seats on sides of rectangle
      const seatsPerSide = Math.ceil(capacity / 4);
      const side = Math.floor(i / seatsPerSide);
      const sides = ["top", "right", "bottom", "left"];
      seat.position.side = sides[side % 4];
      seat.position.offset = 0;
    }

    seats.push(seat);
  }

  return seats;
}

/**
 * Create seating chart with 4 tables in 2x2 grid
 */
async function createTableSeating() {
  console.log("🎯 Creating table-based seating chart...");
  console.log(`📍 Event ID: ${eventId}`);
  console.log(`🔗 Convex URL: ${CONVEX_URL}\n`);

  const client = new ConvexHttpClient(CONVEX_URL);

  // Create 4 round tables in 2x2 grid layout
  const tables = [
    {
      id: "table-1",
      number: 1,
      shape: "ROUND",
      x: 150,      // Top-left
      y: 150,
      width: 120,
      height: 120,
      rotation: 0,
      capacity: 4,
      seats: generateSeats(4, "table-1", "ROUND")
    },
    {
      id: "table-2",
      number: 2,
      shape: "ROUND",
      x: 350,      // Top-right
      y: 150,
      width: 120,
      height: 120,
      rotation: 0,
      capacity: 4,
      seats: generateSeats(4, "table-2", "ROUND")
    },
    {
      id: "table-3",
      number: 3,
      shape: "ROUND",
      x: 150,      // Bottom-left
      y: 350,
      width: 120,
      height: 120,
      rotation: 0,
      capacity: 4,
      seats: generateSeats(4, "table-3", "ROUND")
    },
    {
      id: "table-4",
      number: 4,
      shape: "ROUND",
      x: 350,      // Bottom-right
      y: 350,
      width: 120,
      height: 120,
      rotation: 0,
      capacity: 4,
      seats: generateSeats(4, "table-4", "ROUND")
    }
  ];

  // Calculate total seats
  const totalSeats = tables.reduce((sum, table) => sum + table.capacity, 0);

  console.log("📊 Seating Configuration:");
  console.log(`   - Tables: ${tables.length}`);
  console.log(`   - Capacity per table: 4 seats`);
  console.log(`   - Total seats: ${totalSeats}`);
  console.log(`   - Layout: 2x2 grid\n`);

  try {
    const result = await client.mutation(api.seating.mutations.createSeatingChart, {
      eventId,
      name: "Main Hall - Table Seating",
      seatingStyle: "TABLE_BASED",
      sections: [
        {
          id: "section-main",
          name: "Main Floor",
          color: "#4F46E5",
          x: 0,
          y: 0,
          width: 600,
          height: 600,
          rotation: 0,
          containerType: "TABLES",
          tables: tables
        }
      ]
    });

    console.log("✅ Seating chart created successfully!");
    console.log(`📋 Seating Chart ID: ${result.seatingChartId}\n`);

    console.log("📍 Table Positions:");
    tables.forEach((table, i) => {
      console.log(`   Table ${table.number}: (${table.x}, ${table.y}) - ${table.capacity} seats`);
    });

    console.log("\n🎉 Done! Your event now has a table-based seating chart.");
    console.log("💡 Next step: Create ticket tiers with table package option enabled.");

    return result;
  } catch (error) {
    console.error("❌ Error creating seating chart:", error.message);
    if (error.data) {
      console.error("Error details:", error.data);
    }
    process.exit(1);
  }
}

// Run the script
createTableSeating()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
