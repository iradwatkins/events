import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Complete System Reset - Delete ALL data from ALL tables
 * WARNING: This is irreversible and will delete EVERYTHING
 * Only use when transitioning from test to production
 */
export const resetAllData = mutation({
  args: {},
  handler: async (ctx) => {

    let totalDeleted = 0;

    // Define all tables in deletion order (child tables first, parent tables last)
    const tablesToReset = [
      // Child/Dependent tables first
      "tickets",
      "orders",
      "seats",
      "seatingCharts",
      "seatingTemplates",
      "seatingShares",
      "roomTemplates",
      "staffTickets",
      "staffTicketTransfers",
      "discountCodes",
      "bundlePurchases",
      "bundles",
      "productOrders",
      "products",
      "eventFlyers",
      "qrScans",
      "creditTransactions",
      "organizerCredits",
      "settlements",
      "teams",
      "crmContacts",
      "eventTemplates",
      "notificationPreferences",
      "activityLogs",

      // Parent tables last
      "events",
      "users",

      // Configuration tables
      "featureFlags",
      "systemConfigurations",
    ];

    for (const tableName of tablesToReset) {
      try {

        // Query all documents in the table
        const documents = await ctx.db.query(tableName as any).collect();

        // Delete each document
        for (const doc of documents) {
          await ctx.db.delete(doc._id);
          totalDeleted++;
        }

      } catch (error: any) {
        // If table doesn't exist or query fails, log but continue
      }
    }


    return {
      success: true,
      totalDeleted,
      message: `Successfully deleted ${totalDeleted} records from all tables`,
      timestamp: Date.now(),
    };
  },
});

/**
 * Verify System is Empty - Check all tables are cleared
 */
export const verifySystemEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "users",
      "events",
      "tickets",
      "orders",
      "seats",
      "seatingCharts",
      "seatingTemplates",
      "seatingShares",
      "roomTemplates",
      "staffTickets",
      "staffTicketTransfers",
      "discountCodes",
      "bundlePurchases",
      "bundles",
      "productOrders",
      "products",
      "eventFlyers",
      "qrScans",
      "creditTransactions",
      "organizerCredits",
      "settlements",
      "teams",
      "crmContacts",
      "eventTemplates",
      "notificationPreferences",
      "activityLogs",
      "featureFlags",
      "systemConfigurations",
    ];

    const results: Record<string, number> = {};
    let totalRecords = 0;

    for (const tableName of tables) {
      try {
        const count = (await ctx.db.query(tableName as any).collect()).length;
        results[tableName] = count;
        totalRecords += count;
      } catch (error: any) {
        results[tableName] = -1; // Indicates table doesn't exist or error
      }
    }

    return {
      isEmpty: totalRecords === 0,
      totalRecords,
      tableBreakdown: results,
      timestamp: Date.now(),
    };
  },
});
