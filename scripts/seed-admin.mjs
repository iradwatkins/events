#!/usr/bin/env node

/**
 * Seed Admin Account for Fresh System
 * Creates one admin user: iradwatkins@gmail.com
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ ERROR: CONVEX_URL not found in environment");
  console.error("Make sure .env.local is configured with NEXT_PUBLIC_CONVEX_URL");
  process.exit(1);
}

console.log("🌱 Seeding Admin Account...\n");
console.log(`📡 Convex URL: ${CONVEX_URL}\n`);

const client = new ConvexHttpClient(CONVEX_URL);

async function seedAdmin() {
  try {
    console.log("Creating admin user: iradwatkins@gmail.com");

    // Generate secure password hash using bcrypt
    const password = "Bobby321!"; // Temporary password - MUST CHANGE ON FIRST LOGIN
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    // Create admin user via Convex mutation
    const userId = await client.mutation(api.auth.mutations.createUserWithPassword, {
      email: "iradwatkins@gmail.com",
      name: "Ira Watkins",
      passwordHash: hash,
      role: "admin",
    });

    console.log("\n✅ Admin user created successfully!");
    console.log(`   User ID: ${userId}`);

    console.log("\n📋 Admin Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Email: iradwatkins@gmail.com`);
    console.log(`  Temporary Password: ${password}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
    console.log("  1. Change the temporary password immediately on first login");
    console.log("  2. Enable 2FA if available");
    console.log("  3. This password is only for initial setup");
    console.log("  4. Admin account has been initialized with 10,000 credits");

    return userId;
  } catch (error) {
    console.error("\n❌ Error seeding admin:", error);
    throw error;
  }
}

// Run the seeder
seedAdmin()
  .then(() => {
    console.log("\n🎉 Admin seed completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
