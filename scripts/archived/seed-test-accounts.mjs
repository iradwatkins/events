import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";

const convex = new ConvexHttpClient(CONVEX_URL);

const testAccounts = [
  // Admin account (already created, but included for reference)
  {
    email: "ira@irawatkins.com",
    password: "Bobby321!",
    name: "Ira Watkins",
    role: "admin"
  },
  // Event Organizers
  {
    email: "organizer1@stepperslife.com",
    password: "Bobby321!",
    name: "Event Organizer 1",
    role: "organizer"
  },
  {
    email: "organizer2@stepperslife.com",
    password: "Bobby321!",
    name: "Event Organizer 2",
    role: "organizer"
  },
  {
    email: "organizer3@stepperslife.com",
    password: "Bobby321!",
    name: "Event Organizer 3",
    role: "organizer"
  },
  // Regular Users (Supporters/Attendees)
  {
    email: "supporter1@stepperslife.com",
    password: "Bobby321!",
    name: "Supporter 1",
    role: "user"
  },
  {
    email: "supporter2@stepperslife.com",
    password: "Bobby321!",
    name: "Supporter 2",
    role: "user"
  },
  {
    email: "supporter3@stepperslife.com",
    password: "Bobby321!",
    name: "Supporter 3",
    role: "user"
  },
  // Staff accounts (using user role, as staff is managed per event)
  {
    email: "staff1@stepperslife.com",
    password: "Bobby321!",
    name: "Staff Member 1",
    role: "user"
  },
  {
    email: "staff2@stepperslife.com",
    password: "Bobby321!",
    name: "Staff Member 2",
    role: "user"
  },
  {
    email: "staff3@stepperslife.com",
    password: "Bobby321!",
    name: "Staff Member 3",
    role: "user"
  }
];

async function seedTestAccounts() {
  try {
    console.log("🌱 Seeding test accounts...\n");

    const saltRounds = 10;
    let created = 0;
    let skipped = 0;

    for (const account of testAccounts) {
      try {
        // Check if user already exists
        const existingUser = await convex.query(api.users.queries.getUserByEmail, {
          email: account.email,
        });

        if (existingUser) {
          console.log(`⚠️  ${account.email} already exists (${account.role})`);
          skipped++;
          continue;
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(account.password, saltRounds);

        // Create the user
        const userId = await convex.mutation(api.auth.mutations.createUserWithPassword, {
          email: account.email,
          passwordHash: passwordHash,
          name: account.name,
          role: account.role,
        });

        console.log(`✅ Created: ${account.email} (${account.role}) - ID: ${userId}`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating ${account.email}:`, error.message);
      }
    }

    console.log("\n📊 Summary:");
    console.log(`   ✅ Created: ${created} accounts`);
    console.log(`   ⚠️  Skipped: ${skipped} accounts (already exist)`);
    console.log(`   📝 Total: ${testAccounts.length} accounts\n`);

    console.log("🔑 All accounts use password: Bobby321!\n");
    console.log("📧 Test Account List:");
    console.log("   Admin: ira@irawatkins.com");
    console.log("   Organizers: organizer1@stepperslife.com, organizer2@stepperslife.com, organizer3@stepperslife.com");
    console.log("   Supporters: supporter1@stepperslife.com, supporter2@stepperslife.com, supporter3@stepperslife.com");
    console.log("   Staff: staff1@stepperslife.com, staff2@stepperslife.com, staff3@stepperslife.com");
  } catch (error) {
    console.error("❌ Error seeding test accounts:", error);
    process.exit(1);
  }
}

seedTestAccounts();
