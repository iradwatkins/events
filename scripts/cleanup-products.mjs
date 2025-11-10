#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud");

async function cleanupProducts() {
  console.log("🧹 Cleaning up products - keeping 2 samples\n");
  console.log("=" .repeat(60) + "\n");

  try {
    const allProducts = await client.query(api.products.queries.getAllProducts, {});
    console.log(`Found ${allProducts.length} products\n`);

    if (allProducts.length === 0) {
      console.log("No products to clean up.\n");
      return;
    }

    // Keep the best 2 products for demonstration
    // Priority: Designer Shoes (variable pricing) and Premium Jacket (sale pricing)
    const productsToKeep = [
      allProducts.find(p => p.name === "Designer Shoes (Variable Pricing)"),
      allProducts.find(p => p.name === "Premium Jacket (On Sale)")
    ].filter(Boolean);

    // If we don't have those specific ones, just keep the first 2
    if (productsToKeep.length < 2) {
      productsToKeep.push(...allProducts.slice(0, 2 - productsToKeep.length));
    }

    const keepIds = new Set(productsToKeep.map(p => p._id));
    const productsToDelete = allProducts.filter(p => !keepIds.has(p._id));

    console.log("📋 Keeping these products:");
    productsToKeep.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name}`);
      console.log(`     - Price: $${(p.price / 100).toFixed(2)}`);
      console.log(`     - Variants: ${p.variants?.length || 0}`);
      console.log(`     - ID: ${p._id}`);
    });
    console.log("");

    if (productsToDelete.length === 0) {
      console.log("✅ No products to delete.\n");
      return;
    }

    console.log(`🗑️  Deleting ${productsToDelete.length} products...\n`);

    for (let i = 0; i < productsToDelete.length; i++) {
      const product = productsToDelete[i];
      console.log(`  [${i + 1}/${productsToDelete.length}] Deleting "${product.name}"...`);
      await client.mutation(api.products.mutations.deleteProduct, {
        productId: product._id
      });
    }

    console.log(`\n✅ Deleted ${productsToDelete.length} products`);
    console.log("=" .repeat(60));

    // Verify final state
    const finalProducts = await client.query(api.products.queries.getAllProducts, {});
    console.log(`\n📊 Final count: ${finalProducts.length} products remaining\n`);

  } catch (error) {
    console.error("\n❌ Cleanup failed:", error.message);
    console.error(error);
  }
}

cleanupProducts().catch(console.error);
