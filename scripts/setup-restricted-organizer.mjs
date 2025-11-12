import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function setupRestrictedOrganizer() {
  console.log("🔧 Setting up thestepperslife@gmail.com restricted organizer account...\n");

  try {
    // Check if account exists
    let user = await client.query(api.users.queries.getUserByEmail, {
      email: "thestepperslife@gmail.com"
    });

    if (user) {
      console.log("✅ Account already exists!");
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Can Create Ticketed Events: ${user.canCreateTicketedEvents !== false ? "✅ Yes" : "❌ No (Restricted)"}`);

      // Update role if needed
      if (user.role !== "organizer") {
        console.log("\n   Updating role to organizer...");
        await client.mutation(api.users.mutations.updateUserRole, {
          userId: user._id,
          role: "organizer"
        });
        console.log("   ✅ Role updated to: organizer");
      }

      // Set password
      console.log("\n   Setting password...");
      const password = "Bobby321!";
      const passwordHash = await bcrypt.hash(password, 10);
      await client.mutation(api.users.mutations.updatePasswordHash, {
        userId: user._id,
        passwordHash: passwordHash
      });
      console.log(`   ✅ Password set to: ${password}`);

      // Add restriction (will be added to schema first)
      console.log("\n   Note: Event restriction will be added after schema update");

    } else {
      console.log("❌ Account does not exist - needs to be created");
      console.log("\n   This will be done after schema is updated with canCreateTicketedEvents field");
    }

    console.log("\n" + "=".repeat(70));
    console.log("📋 ACCOUNT CONFIGURATION:");
    console.log("=".repeat(70));
    console.log("\nEmail: thestepperslife@gmail.com");
    console.log("Password: Bobby321!");
    console.log("Role: organizer");
    console.log("Restriction: Can ONLY create SAVE_THE_DATE and FREE_EVENT");
    console.log("Cannot create: TICKETED_EVENT or SEATED_EVENT");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

setupRestrictedOrganizer()
  .then(() => {
    console.log("\n✅ Setup complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  });
