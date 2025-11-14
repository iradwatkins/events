import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function resetDatabase() {
  console.log("🧹 COMPLETE DATABASE RESET");
  console.log("=" .repeat(70));
  console.log("\n⚠️  This will:");
  console.log("   - Delete ALL users except ira@irawatkins.com");
  console.log("   - Delete ALL events");
  console.log("   - Delete ALL tickets");
  console.log("   - Delete ALL orders");
  console.log("   - Delete ALL staff assignments");
  console.log("   - Delete ALL event bundles");
  console.log("   - Delete ALL settlements");
  console.log("   - KEEP all products");
  console.log("\n" + "=".repeat(70));

  try {
    // Step 1: Get or create ira@irawatkins.com account
    console.log("\n📧 Step 1: Setting up ira@irawatkins.com...");

    let iraUser = await client.query(api.users.queries.getUserByEmail, {
      email: "ira@irawatkins.com"
    });

    if (iraUser) {
      console.log("   ✓ User exists, updating...");

      // Update role to admin
      await client.mutation(api.users.mutations.updateUserRole, {
        userId: iraUser._id,
        role: "admin"
      });

      // Update password
      const passwordHash = await bcrypt.hash("Bobby321!321", 10);
      await client.mutation(api.users.mutations.updatePasswordHash, {
        userId: iraUser._id,
        passwordHash: passwordHash
      });

      console.log("   ✓ Updated to admin with new password");
    } else {
      console.log("   ✓ Creating new user...");

      const passwordHash = await bcrypt.hash("Bobby321!321", 10);
      const userId = await client.mutation(api.users.mutations.createUser, {
        email: "ira@irawatkins.com",
        name: "Ira Watkins",
        role: "admin",
        passwordHash: passwordHash
      });

      iraUser = await client.query(api.users.queries.getUserByEmail, {
        email: "ira@irawatkins.com"
      });

      console.log("   ✓ Created admin account");
    }

    const iraUserId = iraUser._id;
    console.log(`   User ID: ${iraUserId}`);

    // Step 2: Get all users to delete
    console.log("\n👥 Step 2: Getting all users to delete...");

    // We need to use internal API or create a query that returns all users
    // For now, let's get specific test accounts we know about
    const usersToDelete = [];

    const testEmails = [
      "bobbygwatkins@gmail.com",
      "thestepperslife@gmail.com",
      "test@test.com"
    ];

    for (const email of testEmails) {
      try {
        const user = await client.query(api.users.queries.getUserByEmail, { email });
        if (user) {
          usersToDelete.push({ email, id: user._id });
        }
      } catch (e) {
        // User doesn't exist, skip
      }
    }

    console.log(`   Found ${usersToDelete.length} test users to delete`);

    // Note: We can't delete all users without a specific query
    // Let's create a Convex function to handle this
    console.log("\n⚠️  Note: To delete ALL users, we need to run a Convex internal mutation");
    console.log("   Listing users found:");
    usersToDelete.forEach(u => console.log(`   - ${u.email} (${u.id})`));

    console.log("\n" + "=".repeat(70));
    console.log("✅ SETUP COMPLETE");
    console.log("=" .repeat(70));
    console.log("\n📋 ADMIN ACCOUNT:");
    console.log("   Email: ira@irawatkins.com");
    console.log("   Password: Bobby321!321");
    console.log("   Role: admin");
    console.log("\n🔗 Login: https://events.stepperslife.com/login");
    console.log("\n⚠️  NEXT STEPS:");
    console.log("   1. Deploy the internal cleanup mutation to Convex");
    console.log("   2. Run the internal mutation to delete all data except products");
    console.log("   3. Test login with ira@irawatkins.com");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    throw error;
  }
}

resetDatabase()
  .then(() => {
    console.log("\n✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
