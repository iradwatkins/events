#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud");

// Helper to generate random inventory quantity
function randomQuantity(min = 25, max = 200) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function testProductLifecycle() {
  console.log("🔄 Product Lifecycle Test\n");
  console.log("=" .repeat(60) + "\n");

  try {
    // Step 1: Get all products
    console.log("📦 Step 1: Fetching all products...");
    const allProducts = await client.query(api.products.queries.getAllProducts, {});
    console.log(`✅ Found ${allProducts.length} products\n`);

    if (allProducts.length === 0) {
      console.log("❌ No products found! Please run create-test-products.mjs first.\n");
      return;
    }

    // Step 2: Edit each product with random quantities
    console.log("✏️  Step 2: Updating inventory quantities...");
    const updatedProducts = [];

    for (const product of allProducts) {
      const newQuantity = randomQuantity();
      console.log(`  - ${product.name}: ${product.inventoryQuantity} → ${newQuantity}`);

      await client.mutation(api.products.mutations.updateProduct, {
        productId: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        sku: product.sku,
        inventoryQuantity: newQuantity,
        trackInventory: product.trackInventory,
        category: product.category,
        tags: product.tags,
        primaryImage: product.primaryImage,
        hasVariants: product.hasVariants,
        requiresShipping: product.requiresShipping,
        weight: product.weight,
        shippingPrice: product.shippingPrice,
        status: product.status
      });

      updatedProducts.push({ ...product, inventoryQuantity: newQuantity });
    }
    console.log(`✅ Updated ${updatedProducts.length} products\n`);

    // Step 3: Duplicate all products
    console.log("📋 Step 3: Duplicating all products...");
    const duplicatedIds = [];

    for (const product of updatedProducts) {
      console.log(`  - Duplicating "${product.name}"...`);
      const newProductId = await client.mutation(api.products.mutations.duplicateProduct, {
        productId: product._id
      });
      duplicatedIds.push(newProductId);
      console.log(`    ✅ Created duplicate: ${newProductId}`);
    }
    console.log(`✅ Created ${duplicatedIds.length} duplicates\n`);

    // Step 4: Get updated product list
    const allProductsAfterDuplication = await client.query(api.products.queries.getAllProducts, {});
    console.log(`📊 Total products after duplication: ${allProductsAfterDuplication.length}\n`);

    // Step 5: Delete all but 3 products
    console.log("🗑️  Step 4: Deleting all but 3 products...");
    const productsToKeep = 3;
    const productsToDelete = allProductsAfterDuplication.slice(productsToKeep);

    console.log(`  Keeping: ${productsToKeep} products`);
    console.log(`  Deleting: ${productsToDelete.length} products\n`);

    for (let i = 0; i < productsToDelete.length; i++) {
      const product = productsToDelete[i];
      console.log(`  [${i + 1}/${productsToDelete.length}] Deleting "${product.name}"...`);
      await client.mutation(api.products.mutations.deleteProduct, {
        productId: product._id
      });
    }
    console.log(`✅ Deleted ${productsToDelete.length} products\n`);

    // Step 6: Verify final state
    console.log("✅ Step 5: Verifying final state...");
    const finalProducts = await client.query(api.products.queries.getAllProducts, {});
    console.log(`  Total products remaining: ${finalProducts.length}`);
    console.log(`  Expected: ${productsToKeep}`);
    console.log(`  Match: ${finalProducts.length === productsToKeep ? '✅' : '❌'}\n`);

    if (finalProducts.length === productsToKeep) {
      console.log("🎉 Remaining products:");
      finalProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name}`);
        console.log(`     - Price: $${(product.price / 100).toFixed(2)}`);
        console.log(`     - Stock: ${product.inventoryQuantity}`);
        console.log(`     - Status: ${product.status}`);
        console.log(`     - Variants: ${product.variants?.length || 0}`);
        console.log("");
      });
    }

    // Summary
    console.log("=" .repeat(60));
    console.log("✅ LIFECYCLE TEST COMPLETED!");
    console.log("=" .repeat(60));
    console.log("\n📊 Summary:");
    console.log(`  - Initial products: ${allProducts.length}`);
    console.log(`  - Updated products: ${updatedProducts.length} ✅`);
    console.log(`  - Duplicated: ${duplicatedIds.length} ✅`);
    console.log(`  - After duplication: ${allProductsAfterDuplication.length}`);
    console.log(`  - Deleted: ${productsToDelete.length} ✅`);
    console.log(`  - Final count: ${finalProducts.length} (target: ${productsToKeep}) ${finalProducts.length === productsToKeep ? '✅' : '❌'}`);
    console.log("\n🌐 View products:");
    console.log(`  - Admin Panel: http://localhost:3004/admin/products`);
    console.log(`  - Shop View: http://localhost:3004/shop`);

  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
  }
}

testProductLifecycle().catch(console.error);
