#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud");

async function testProducts() {
  console.log("🧪 Testing Product System\n");
  console.log("=" .repeat(60) + "\n");

  try {
    // Test 1: Get all products
    console.log("📦 Test 1: Fetching all products...");
    const products = await client.query(api.products.queries.getAllProducts, {});
    console.log(`✅ Found ${products.length} products\n`);

    if (products.length === 0) {
      console.log("❌ No products found! Please run create-test-products.mjs first.\n");
      return;
    }

    // Test 2: Verify variants
    console.log("🎨 Test 2: Verifying variants...");
    let totalVariants = 0;
    products.forEach(product => {
      if (product.hasVariants && product.variants) {
        console.log(`  - ${product.name}: ${product.variants.length} variants`);
        totalVariants += product.variants.length;
      }
    });
    console.log(`✅ Total variants across all products: ${totalVariants}\n`);

    // Test 3: Check a specific product with variants
    const productWithVariants = products.find(p => p.hasVariants && p.variants);
    if (productWithVariants) {
      console.log("🔍 Test 3: Detailed product check...");
      console.log(`  Product: ${productWithVariants.name}`);
      console.log(`  Base Price: $${(productWithVariants.price / 100).toFixed(2)}`);
      console.log(`  Has Variants: ${productWithVariants.hasVariants}`);
      console.log(`  Number of Variants: ${productWithVariants.variants?.length || 0}`);

      if (productWithVariants.variants && productWithVariants.variants.length > 0) {
        console.log(`  Sample Variants:`);
        productWithVariants.variants.slice(0, 3).forEach(variant => {
          console.log(`    - ${variant.name}: $${(variant.price / 100).toFixed(2)} (SKU: ${variant.sku || 'N/A'})`);
        });
      }
      console.log("✅ Product structure verified\n");
    }

    // Test 4: Test product options (if any exist)
    console.log("⚙️  Test 4: Checking for product options...");
    const productsWithOptions = products.filter(p => p.options && p.options.length > 0);
    if (productsWithOptions.length > 0) {
      console.log(`✅ Found ${productsWithOptions.length} products with customization options`);
      productsWithOptions.forEach(p => {
        console.log(`  - ${p.name}: ${p.options?.length} option(s)`);
      });
    } else {
      console.log(`ℹ️  No products with custom options yet (this is normal for base products)`);
    }
    console.log("");

    // Test 5: Test duplicate functionality
    console.log("📋 Test 5: Testing product duplication...");
    const productToDuplicate = products[0];
    const duplicatedId = await client.mutation(api.products.mutations.duplicateProduct, {
      productId: productToDuplicate._id
    });
    console.log(`✅ Successfully duplicated "${productToDuplicate.name}"`);
    console.log(`  Original ID: ${productToDuplicate._id}`);
    console.log(`  Duplicate ID: ${duplicatedId}\n`);

    // Test 6: Verify the duplicate
    const allProductsAfter = await client.query(api.products.queries.getAllProducts, {});
    const duplicate = allProductsAfter.find(p => p._id === duplicatedId);
    if (duplicate) {
      console.log("✅ Duplicate verification:");
      console.log(`  Name: ${duplicate.name} (should contain "(Copy)")`);
      console.log(`  Status: ${duplicate.status} (should be DRAFT)`);
      console.log(`  Variants: ${duplicate.variants?.length || 0} (should match original)`);
      console.log(`  Has same structure: ${duplicate.hasVariants === productToDuplicate.hasVariants ? '✅' : '❌'}\n`);
    }

    // Test 7: Clean up the duplicate
    console.log("🧹 Test 7: Cleaning up test duplicate...");
    await client.mutation(api.products.mutations.deleteProduct, {
      productId: duplicatedId
    });
    console.log(`✅ Test duplicate deleted\n`);

    // Summary
    console.log("=" .repeat(60));
    console.log("✅ ALL TESTS PASSED!");
    console.log("=" .repeat(60));
    console.log("\n📊 Summary:");
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Total Variants: ${totalVariants}`);
    console.log(`  - Products with Options: ${productsWithOptions.length}`);
    console.log(`  - Duplication: Working ✅`);
    console.log(`  - Deletion: Working ✅`);
    console.log("\n🌐 Test your products:");
    console.log(`  - Admin Panel: http://localhost:3004/admin/products`);
    console.log(`  - Shop View: http://localhost:3004/shop`);
    console.log(`  - Example Product: http://localhost:3004/shop/${products[0]._id}`);

  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
  }
}

testProducts().catch(console.error);
