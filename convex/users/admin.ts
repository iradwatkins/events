import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Internal mutation to bulk delete users
 * This bypasses authentication and can only be called from scripts/crons
 */
export const bulkDeleteUsers = internalMutation({
  args: {
    emailsToKeep: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("🔍 Starting bulk user deletion...");

    // Get all users
    const allUsers = await ctx.db.query("users").collect();

    const emailsToKeepLower = args.emailsToKeep.map((e) => e.toLowerCase());

    // Filter users to delete
    const usersToDelete = allUsers.filter(
      (user) => !emailsToKeepLower.includes(user.email.toLowerCase())
    );

    console.log(`Found ${allUsers.length} total users`);
    console.log(`Keeping ${allUsers.length - usersToDelete.length} users`);
    console.log(`Deleting ${usersToDelete.length} users`);

    let deletedCount = 0;

    // Delete each user
    for (const user of usersToDelete) {
      try {
        await ctx.db.delete(user._id);
        deletedCount++;
        console.log(`✓ Deleted: ${user.email}`);
      } catch (error) {
        console.error(`✗ Failed to delete ${user.email}:`, error);
      }
    }

    // Ensure remaining users are admins
    const remainingUsers = await ctx.db.query("users").collect();
    for (const user of remainingUsers) {
      if (user.role !== "admin") {
        await ctx.db.patch(user._id, {
          role: "admin",
          updatedAt: Date.now(),
        });
        console.log(`✓ Set ${user.email} to admin role`);
      }
    }

    return {
      success: true,
      totalUsers: allUsers.length,
      deletedCount,
      remainingCount: remainingUsers.length,
    };
  },
});
