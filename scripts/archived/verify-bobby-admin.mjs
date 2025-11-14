import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function verifyBobbyAdmin() {
  console.log("🔍 Verifying bobbygwatkins@gmail.com account...\n");

  try {
    const user = await client.query(api.users.queries.getUserByEmail, {
      email: "bobbygwatkins@gmail.com"
    });

    if (user) {
      console.log("✅ Account found!");
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Has Password: ${user.passwordHash ? "✅ Yes" : "❌ No"}`);
      console.log(`   Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : "Unknown"}`);

      if (user.role === "admin") {
        console.log("\n✅ Bobby is already an ADMIN - no changes needed!");
      } else {
        console.log(`\n⚠️  Bobby's current role is "${user.role}" - should be "admin"`);
        console.log("   Need to update role to admin");
      }
    } else {
      console.log("❌ Account NOT FOUND");
      console.log("   Bobby's account needs to be created");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

verifyBobbyAdmin()
  .then(() => {
    console.log("\n✅ Verification complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  });
