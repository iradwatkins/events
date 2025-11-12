import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";
import bcrypt from 'bcryptjs';

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function setupOrganizer() {
  const email = "organizer1@stepperslife.com";
  const password = "Bobby321!";
  const name = "Test Organizer";
  
  console.log("\n🔧 Setting up organizer account...");
  console.log("Email:", email);
  
  try {
    // Check if user exists
    const existingUsers = await client.query(api.users.queries.listUsers);
    let user = existingUsers.find(u => u.email === email);
    
    if (user) {
      console.log("✅ User already exists:", user._id);
    } else {
      console.log("📝 Creating new user...");
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user via mutation
      const userId = await client.mutation(api.users.mutations.createUser, {
        email,
        name,
        passwordHash,
        role: "organizer",
        authProvider: "password",
      });
      
      console.log("✅ User created:", userId);
      user = { _id: userId, email, name, role: "organizer" };
    }
    
    // Initialize or update credits to 300
    console.log("\n💳 Setting up credits...");
    
    try {
      await client.mutation(api.credits.mutations.initializeCredits, {
        organizerId: user._id,
      });
      console.log("✅ Credits initialized");
    } catch (error) {
      console.log("ℹ️  Credits already initialized");
    }
    
    // Get current credits
    const credits = await client.query(api.credits.queries.getCreditBalance, {
      organizerId: user._id,
    });
    
    console.log("\n📊 Current Credits:");
    console.log("  Total:", credits.creditsTotal);
    console.log("  Used:", credits.creditsUsed);
    console.log("  Remaining:", credits.creditsRemaining);
    
    // If not 300, reset to 300
    if (credits.creditsTotal !== 300) {
      console.log("\n🔄 Resetting to 300 credits...");
      await client.mutation(api.credits.mutations.resetToFreeCredits, {
        organizerId: user._id,
      });
      
      const updatedCredits = await client.query(api.credits.queries.getCreditBalance, {
        organizerId: user._id,
      });
      
      console.log("✅ Credits reset to:", updatedCredits.creditsTotal);
    }
    
    console.log("\n✅ SETUP COMPLETE!");
    console.log("════════════════════════════════════════");
    console.log("Email:    ", email);
    console.log("Password: ", password);
    console.log("Role:     ", user.role);
    console.log("Credits:  ", "300 tickets");
    console.log("════════════════════════════════════════");
    console.log("\n🔗 Login at: https://events.stepperslife.com/login");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

setupOrganizer();
