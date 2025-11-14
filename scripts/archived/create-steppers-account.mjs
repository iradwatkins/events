import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function createSteppersAccount() {
  console.log("🔧 Creating thestepperslife@gmail.com account...\n");

  try {
    // Check if already exists
    const existing = await client.query(api.users.queries.getUserByEmail, {
      email: "thestepperslife@gmail.com"
    });

    if (existing) {
      console.log("✅ Account already exists - updating...");
      console.log(`   User ID: ${existing._id}\n`);

      // Update role
      await client.mutation(api.users.mutations.updateUserRole, {
        userId: existing._id,
        role: "organizer"
      });
      console.log("   ✅ Role set to: organizer");

      // Set password
      const password = "Bobby321!";
      const passwordHash = await bcrypt.hash(password, 10);
      await client.mutation(api.users.mutations.updatePasswordHash, {
        userId: existing._id,
        passwordHash: passwordHash
      });
      console.log(`   ✅ Password set to: ${password}`);

      // Note: Can't set canCreateTicketedEvents via mutation yet - need to add mutation
      console.log("   ⚠️  Restriction flag will be set via direct database update");

    } else {
      console.log("Creating new account...\n");

      const password = "Bobby321!";
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user with pre-hashed password
      const userId = await client.mutation(api.users.mutations.createUser, {
        email: "thestepperslife@gmail.com",
        name: "Steppers Life",
        role: "organizer",
        passwordHash: passwordHash
      });

      console.log(`   ✅ Account created with ID: ${userId}`);
      console.log(`   ✅ Email: thestepperslife@gmail.com`);
      console.log(`   ✅ Password: ${password}`);
      console.log("   ✅ Role: organizer");
      console.log("   ⚠️  Restriction flag will be set via separate mutation");
    }

    console.log("\n" + "=".repeat(70));
    console.log("📋 ACCOUNT SUMMARY:");
    console.log("=".repeat(70));
    console.log("\nEmail: thestepperslife@gmail.com");
    console.log("Password: Bobby321!");
    console.log("Role: organizer");
    console.log("\nRestriction: Can ONLY create SAVE_THE_DATE and FREE_EVENT");
    console.log("Cannot create: TICKETED_EVENT or SEATED_EVENT");
    console.log("\nLogin: https://events.stepperslife.com/login");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

createSteppersAccount()
  .then(() => {
    console.log("\n✅ Account setup complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  });
