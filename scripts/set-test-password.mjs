import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

const TEST_PASSWORD = "TestPass123!";
const TEST_EMAIL = "ira@irawatkins.com";

async function setTestPassword() {
  console.log("🔐 Setting up test password...\n");

  try {
    // Hash the password
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    console.log(`✅ Password hashed: ${passwordHash.substring(0, 20)}...`);

    // Get the user
    const user = await client.query(api.users.queries.getUserByEmail, {
      email: TEST_EMAIL
    });

    if (!user) {
      console.error(`❌ User not found: ${TEST_EMAIL}`);
      process.exit(1);
    }

    console.log(`✅ User found: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);

    // Update user with password hash using internal mutation
    await client.mutation(api.users.mutations.updatePasswordHash, {
      userId: user._id,
      passwordHash: passwordHash
    });

    console.log(`\n✅ Password set successfully!`);
    console.log(`\n📋 Login Credentials:`);
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`\n🌐 Login at: https://events.stepperslife.com/login`);

  } catch (error) {
    console.error("❌ Error:", error.message);

    // If the mutation doesn't exist, we need to update the user directly
    // Let's try a different approach
    console.log("\n⚠️  Trying alternative approach...");

    try {
      const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

      // We'll need to use an internal mutation to update the password
      console.log("\n📝 Password hash generated:");
      console.log(passwordHash);
      console.log("\n⚠️  Please manually update the user's passwordHash field in Convex dashboard");
      console.log(`   User email: ${TEST_EMAIL}`);
      console.log(`   Set passwordHash to the value above`);

    } catch (err) {
      console.error("❌ Failed:", err);
    }
  }
}

setTestPassword()
  .then(() => {
    console.log("\n✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
