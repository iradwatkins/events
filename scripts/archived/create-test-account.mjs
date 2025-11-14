import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

/**
 * Helper script to create test accounts after user reset
 *
 * Usage:
 *   node scripts/create-test-account.mjs <name> <email> <password> <role>
 *
 * Example:
 *   node scripts/create-test-account.mjs "John Doe" john@example.com password123 organizer
 *
 * Roles: admin, organizer, user
 */

async function createTestAccount() {
  const [name, email, password, role] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.log("❌ Missing required arguments\n");
    console.log("Usage:");
    console.log("  node scripts/create-test-account.mjs <name> <email> <password> <role>\n");
    console.log("Example:");
    console.log("  node scripts/create-test-account.mjs \"John Doe\" john@example.com password123 organizer\n");
    console.log("Roles: admin, organizer, user (default: organizer)");
    process.exit(1);
  }

  const accountRole = role || "organizer";

  console.log("👤 Creating Test Account");
  console.log("=" .repeat(60));
  console.log(`Name: ${name}`);
  console.log(`Email: ${email}`);
  console.log(`Role: ${accountRole}`);
  console.log("=" .repeat(60) + "\n");

  try {
    // Note: This requires the registerUser mutation to be public
    // You may need to call this via the API endpoint instead
    console.log("⚠️  Note: Account creation should be done via the web interface");
    console.log("📝 Registration URL: https://events.stepperslife.com/register\n");
    console.log("Account Details:");
    console.log(`   Name: ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${accountRole}\n`);
    console.log("💡 After registration:");
    console.log("   - Organizers get 300 free tickets");
    console.log("   - Check welcome popup for getting started");
    console.log("   - Visit /organizer/dashboard to create events\n");

  } catch (error) {
    console.error("\n❌ Account creation info displayed above");
    console.log("   Use the web registration form to create accounts\n");
  }
}

createTestAccount().catch(console.error);
