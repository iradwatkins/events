#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";

async function resetAdminPassword() {
  console.log("🔑 Resetting Admin Password...\n");

  const convex = new ConvexHttpClient(CONVEX_URL);

  const email = "ira@irawatkins.com";
  const newPassword = "Bobby321!";

  try {
    // Get user
    console.log(`📧 Looking for user: ${email}`);
    const user = await convex.query(api.users.queries.getUserByEmail, {
      email: email,
    });

    if (!user) {
      console.error("❌ User not found!");
      console.log("\nCreating new admin user instead...");

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      const userId = await convex.mutation(api.auth.mutations.createUserWithPassword, {
        email: email,
        passwordHash: passwordHash,
        name: "Ira Watkins",
        role: "admin",
      });

      console.log("✅ New admin user created!");
      console.log("📧 Email:", email);
      console.log("🔑 Password:", newPassword);
      console.log("🆔 User ID:", userId);
      return;
    }

    console.log(`✓ User found: ${user.name} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   User ID: ${user._id}\n`);

    // Hash new password
    console.log("🔐 Hashing new password...");
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    console.log("✓ Password hashed\n");

    // Update password
    console.log("💾 Updating password in database...");
    await convex.mutation(api.auth.mutations.updateUserPassword, {
      userId: user._id,
      passwordHash: passwordHash,
    });

    console.log("\n✅ Password reset successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:", email);
    console.log("🔑 New Password:", newPassword);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🌐 Login at: https://events.stepperslife.com/login");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.message.includes("updateUserPassword")) {
      console.log("\n⚠️  The updateUserPassword mutation might not exist.");
      console.log("💡 You may need to manually update the password in the Convex dashboard.");
    }
    process.exit(1);
  }
}

resetAdminPassword()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
