import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";

const convex = new ConvexHttpClient(CONVEX_URL);

async function seedAdmin() {
  try {
    console.log("🌱 Seeding admin user...");

    const email = "ira@irawatkins.com";
    const password = "Bobby321!";
    const name = "Ira Watkins";

    // Check if user already exists
    const existingUser = await convex.query(api.auth.queries.getUserByEmail, {
      email: email,
    });

    if (existingUser) {
      console.log("⚠️  User already exists:", email);
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the admin user
    const userId = await convex.mutation(api.auth.mutations.createUserWithPassword, {
      email: email,
      passwordHash: passwordHash,
      name: name,
      role: "admin",
    });

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);
    console.log("🆔 User ID:", userId);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
