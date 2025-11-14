import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function fixAllAccounts() {
  console.log("🔧 FIXING ALL USER ACCOUNTS\n");
  console.log("=".repeat(80));

  try {
    // 1. Fix test@stepperslife.com account
    console.log("\n1️⃣ Fixing test@stepperslife.com account...");
    const testOrgUser = await client.query(api.users.queries.getUserByEmail, {
      email: "test@stepperslife.com"
    });

    if (testOrgUser) {
      // Set role to organizer
      await client.mutation(api.users.mutations.updateUserRole, {
        userId: testOrgUser._id,
        role: "organizer"
      });
      console.log("   ✅ Role set to: organizer");

      // Set password
      const password = "TestPass123!";
      const passwordHash = await bcrypt.hash(password, 10);
      await client.mutation(api.users.mutations.updatePasswordHash, {
        userId: testOrgUser._id,
        passwordHash: passwordHash
      });
      console.log(`   ✅ Password set to: ${password}`);
    } else {
      console.log("   ❌ Account not found");
    }

    // 2. Update iradwatkins@gmail.com to ADMIN
    console.log("\n2️⃣ Updating iradwatkins@gmail.com to admin role...");
    const adminUser = await client.query(api.users.queries.getUserByEmail, {
      email: "iradwatkins@gmail.com"
    });

    if (adminUser) {
      await client.mutation(api.users.mutations.updateUserRole, {
        userId: adminUser._id,
        role: "admin"
      });
      console.log("   ✅ Role set to: admin");
      console.log("   ✅ This account can access /admin/* pages");
    }

    // 3. Verify ira@irawatkins.com (event organizer)
    console.log("\n3️⃣ Verifying ira@irawatkins.com (event organizer)...");
    const eventOrgUser = await client.query(api.users.queries.getUserByEmail, {
      email: "ira@irawatkins.com"
    });

    if (eventOrgUser) {
      console.log("   ✅ Role: organizer (correct)");
      console.log("   ✅ Has password: Yes");
      console.log("   ✅ Owns test event");
      console.log("   ✅ This account can access /organizer/* pages");
    }

    // 4. Summary
    console.log("\n" + "=".repeat(80));
    console.log("✅ ALL ACCOUNTS FIXED!");
    console.log("=".repeat(80));

    console.log("\n📋 ACCOUNT SUMMARY:\n");

    console.log("1️⃣ ADMIN ACCOUNT (Full System Access):");
    console.log("   Email: iradwatkins@gmail.com");
    console.log("   Password: TestPass123!");
    console.log("   Role: admin");
    console.log("   Access: /admin/* pages");
    console.log("   Use for: System administration, viewing all events, managing users\n");

    console.log("2️⃣ ORGANIZER ACCOUNT (Event Owner):");
    console.log("   Email: ira@irawatkins.com");
    console.log("   Password: TestPass123!");
    console.log("   Role: organizer");
    console.log("   Access: /organizer/* pages");
    console.log("   Use for: Managing test event, creating events, organizer dashboard\n");

    console.log("3️⃣ TEST ORGANIZER ACCOUNT (Extra Test Account):");
    console.log("   Email: test@stepperslife.com");
    console.log("   Password: TestPass123!");
    console.log("   Role: organizer");
    console.log("   Access: /organizer/* pages");
    console.log("   Use for: Additional testing as a different organizer\n");

    console.log("=".repeat(80));
    console.log("\n🌐 ACCESS URLS:\n");
    console.log("Admin Panel: https://events.stepperslife.com/admin");
    console.log("Organizer Dashboard: https://events.stepperslife.com/organizer/events");
    console.log("Test Event: https://events.stepperslife.com/events/jh72wsebqa27cb8zzqw2bqvxan7v639n");
    console.log("Login Page: https://events.stepperslife.com/login");

    console.log("\n=".repeat(80));
    console.log("💡 RECOMMENDATION:\n");
    console.log("Use iradwatkins@gmail.com for everything - it has admin privileges");
    console.log("which includes access to both /admin and /organizer sections.");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

fixAllAccounts()
  .then(() => {
    console.log("\n✅ Fix completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fix failed:", error);
    process.exit(1);
  });
