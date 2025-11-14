import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function resetAllData() {
  console.log("🗑️  Starting complete data reset (keeping products)...\n");

  try {
    // Get all data to delete
    const events = await client.query(api.events.queries.getAllEvents);
    const tickets = await client.query(api.tickets.queries.getAllTickets);

    console.log("📊 Data to delete:");
    console.log(`   - Events: ${events.length}`);
    console.log(`   - Tickets: ${tickets.length}`);
    console.log("\n");

    // Delete all tickets
    console.log("🎫 Deleting all tickets...");
    for (const ticket of tickets) {
      try {
        await client.mutation(api.tickets.mutations.deleteTicket, {
          ticketId: ticket._id,
        });
        console.log(`   ✓ Deleted ticket: ${ticket._id}`);
      } catch (error) {
        console.log(`   ⚠️  Could not delete ticket ${ticket._id}: ${error.message}`);
      }
    }

    // Delete all events
    console.log("\n📅 Deleting all events...");
    for (const event of events) {
      try {
        await client.mutation(api.events.mutations.deleteEvent, {
          eventId: event._id,
        });
        console.log(`   ✓ Deleted event: ${event.name}`);
      } catch (error) {
        console.log(`   ⚠️  Could not delete event ${event._id}: ${error.message}`);
      }
    }

    // Try to get and delete orders
    console.log("\n📦 Attempting to delete orders...");
    try {
      const orders = await client.query(api.orders.queries.getAllOrders);
      console.log(`   - Found ${orders.length} orders`);

      for (const order of orders) {
        try {
          await client.mutation(api.orders.mutations.deleteOrder, {
            orderId: order._id,
          });
          console.log(`   ✓ Deleted order: ${order._id}`);
        } catch (error) {
          console.log(`   ⚠️  Could not delete order ${order._id}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not access orders: ${error.message}`);
    }

    // Try to get and delete ticket tiers
    console.log("\n🎟️  Attempting to delete ticket tiers...");
    try {
      // We'll need to query by event since there's no getAllTicketTiers
      for (const event of events) {
        const tiers = await client.query(api.tickets.queries.getEventTicketTiers, {
          eventId: event._id,
        });

        for (const tier of tiers) {
          try {
            await client.mutation(api.tickets.mutations.deleteTicketTier, {
              tierId: tier._id,
            });
            console.log(`   ✓ Deleted tier: ${tier.name}`);
          } catch (error) {
            console.log(`   ⚠️  Could not delete tier ${tier._id}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not access ticket tiers: ${error.message}`);
    }

    // Try to reset organizer credits
    console.log("\n💰 Resetting organizer credits...");
    try {
      // Get the main test user
      const user = await client.query(api.users.queries.getUserByEmail, {
        email: "ira@irawatkins.com",
      });

      if (user) {
        await client.mutation(api.credits.mutations.resetToFreeCredits, {
          organizerId: user._id,
        });
        console.log(`   ✓ Reset credits for ${user.email} to 300 free credits`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not reset credits: ${error.message}`);
    }

    // Try to delete payment configs
    console.log("\n💳 Attempting to delete payment configurations...");
    try {
      for (const event of events) {
        const config = await client.query(api.paymentConfig.queries.getEventPaymentConfig, {
          eventId: event._id,
        });

        if (config) {
          await client.mutation(api.paymentConfig.mutations.deletePaymentConfig, {
            configId: config._id,
          });
          console.log(`   ✓ Deleted payment config for event: ${event.name}`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not delete payment configs: ${error.message}`);
    }

    // Try to delete seating data
    console.log("\n💺 Attempting to delete seating data...");
    try {
      for (const event of events) {
        // Delete seating layout
        try {
          const layout = await client.query(api.seating.queries.getSeatingLayout, {
            eventId: event._id,
          });

          if (layout) {
            await client.mutation(api.seating.mutations.deleteSeatingLayout, {
              layoutId: layout._id,
            });
            console.log(`   ✓ Deleted seating layout for event: ${event.name}`);
          }
        } catch (error) {
          // Skip if no layout exists
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not delete seating data: ${error.message}`);
    }

    // Try to delete event staff
    console.log("\n👥 Attempting to delete event staff...");
    try {
      for (const event of events) {
        const staff = await client.query(api.staff.queries.getEventStaff, {
          eventId: event._id,
        });

        for (const member of staff) {
          try {
            await client.mutation(api.staff.mutations.deleteStaffMember, {
              staffId: member._id,
            });
            console.log(`   ✓ Deleted staff member: ${member.staffName || member._id}`);
          } catch (error) {
            console.log(`   ⚠️  Could not delete staff ${member._id}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not delete staff: ${error.message}`);
    }

    console.log("\n✅ DATA RESET COMPLETE!");
    console.log("📦 Products have been preserved");
    console.log("💳 User accounts have been preserved");
    console.log("🎫 Ready for fresh testing!");

  } catch (error) {
    console.error("❌ Error during reset:", error);
    throw error;
  }
}

// Run the reset
resetAllData()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
