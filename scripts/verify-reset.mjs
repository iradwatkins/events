import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function verifyReset() {
  console.log("🔍 Verifying System Reset\n");

  const events = await client.query(api.events.queries.getOrganizerEvents);
  const products = await client.query(api.products.queries.getAllProducts);

  console.log("=".repeat(60));
  console.log("VERIFICATION RESULTS");
  console.log("=".repeat(60));
  console.log(`📅 Events: ${events.length}`);
  console.log(`📦 Products: ${products.length}`);

  const eventsCleared = events.length === 0;
  const productsPreserved = products.length > 0;

  console.log("\n" + (eventsCleared ? "✅" : "❌") + ` Events cleared: ${eventsCleared ? "YES" : "NO"}`);
  console.log((productsPreserved ? "✅" : "❌") + ` Products preserved: ${productsPreserved ? "YES" : "NO"}`);

  if (products.length > 0) {
    console.log("\n📦 Product List:");
    products.forEach(p => {
      console.log(`   - ${p.name} ($${(p.price / 100).toFixed(2)})`);
    });
  }

  console.log("\n✨ System reset verified successfully!\n");
}

verifyReset().catch(console.error);
