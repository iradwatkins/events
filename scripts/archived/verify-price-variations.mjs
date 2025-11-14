#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud");

async function verifyPriceVariations() {
  console.log("✅ Verifying Price Variations\n");
  console.log("=" .repeat(60) + "\n");

  try {
    const allProducts = await client.query(api.products.queries.getAllProducts, { status: "ACTIVE" });

    const testProducts = [
      allProducts.find(p => p.name === "Basic T-Shirt (No Sale)"),
      allProducts.find(p => p.name === "Premium Jacket (On Sale)"),
      allProducts.find(p => p.name === "Designer Shoes (Variable Pricing)"),
      allProducts.find(p => p.name === "Luxury Watch (High Ticket)")
    ].filter(Boolean);

    if (testProducts.length === 0) {
      console.log("❌ No test products found! Please run test-price-variations.mjs first.\n");
      return;
    }

    console.log(`Found ${testProducts.length} test products to verify\n`);

    // Test 1: Basic T-Shirt - No sale price
    const basicTshirt = testProducts.find(p => p.name === "Basic T-Shirt (No Sale)");
    if (basicTshirt) {
      console.log("1️⃣  Basic T-Shirt (No Sale) - Test Results:");
      console.log(`   ✅ Base Price: $${(basicTshirt.price / 100).toFixed(2)}`);
      console.log(`   ${!basicTshirt.compareAtPrice ? '✅' : '❌'} No compare price: ${basicTshirt.compareAtPrice ? 'FAILED - has compare price' : 'PASSED'}`);
      console.log(`   ${basicTshirt.variants?.length === 4 ? '✅' : '❌'} Variants: ${basicTshirt.variants?.length} (expected 4)`);

      if (basicTshirt.variants) {
        const allSamePrice = basicTshirt.variants.every(v => v.price === basicTshirt.price);
        console.log(`   ${allSamePrice ? '✅' : '❌'} All variants same price: ${allSamePrice ? 'PASSED' : 'FAILED'}`);

        console.log(`   Variant Details:`);
        basicTshirt.variants.forEach(v => {
          console.log(`     - ${v.name}: $${(v.price / 100).toFixed(2)}`);
        });
      }
      console.log("");
    }

    // Test 2: Premium Jacket - Sale pricing
    const premiumJacket = testProducts.find(p => p.name === "Premium Jacket (On Sale)");
    if (premiumJacket) {
      console.log("2️⃣  Premium Jacket (On Sale) - Test Results:");
      console.log(`   ✅ Base Price: $${(premiumJacket.price / 100).toFixed(2)}`);
      console.log(`   ${premiumJacket.compareAtPrice ? '✅' : '❌'} Compare Price: $${(premiumJacket.compareAtPrice / 100).toFixed(2)}`);

      const discount = Math.round((1 - premiumJacket.price / premiumJacket.compareAtPrice) * 100);
      console.log(`   ✅ Discount: ${discount}% (expected 38%)`);
      console.log(`   ${premiumJacket.shippingPrice ? '✅' : '❌'} Shipping: $${(premiumJacket.shippingPrice / 100).toFixed(2)}`);
      console.log(`   ${premiumJacket.variants?.length === 12 ? '✅' : '❌'} Variants: ${premiumJacket.variants?.length} (expected 12)`);

      if (premiumJacket.variants) {
        const allSamePrice = premiumJacket.variants.every(v => v.price === premiumJacket.price);
        console.log(`   ${allSamePrice ? '✅' : '❌'} All variants same price: ${allSamePrice ? 'PASSED' : 'FAILED'}`);
      }
      console.log("");
    }

    // Test 3: Designer Shoes - Variable pricing
    const designerShoes = testProducts.find(p => p.name === "Designer Shoes (Variable Pricing)");
    if (designerShoes) {
      console.log("3️⃣  Designer Shoes (Variable Pricing) - Test Results:");
      console.log(`   ✅ Base Price: $${(designerShoes.price / 100).toFixed(2)}`);
      console.log(`   ${designerShoes.compareAtPrice ? '✅' : '❌'} Compare Price: $${(designerShoes.compareAtPrice / 100).toFixed(2)}`);
      console.log(`   ${designerShoes.shippingPrice ? '✅' : '❌'} Shipping: $${(designerShoes.shippingPrice / 100).toFixed(2)}`);
      console.log(`   ${designerShoes.variants?.length === 10 ? '✅' : '❌'} Variants: ${designerShoes.variants?.length} (expected 10)`);

      if (designerShoes.variants) {
        const prices = designerShoes.variants.map(v => v.price);
        const uniquePrices = [...new Set(prices)];
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        console.log(`   ${uniquePrices.length > 1 ? '✅' : '❌'} Variable pricing: ${uniquePrices.length > 1 ? 'PASSED' : 'FAILED'}`);
        console.log(`   Price Range: $${(minPrice / 100).toFixed(2)} - $${(maxPrice / 100).toFixed(2)}`);
        console.log(`   Unique price points: ${uniquePrices.length}`);

        console.log(`   Variant Details (by size):`);
        const sortedBySize = [...designerShoes.variants].sort((a, b) =>
          parseInt(a.options.size) - parseInt(b.options.size)
        );

        sortedBySize.forEach(v => {
          console.log(`     - Size ${v.options.size} (${v.options.color}): $${(v.price / 100).toFixed(2)}`);
        });
      }
      console.log("");
    }

    // Test 4: Luxury Watch - High ticket, no variants
    const luxuryWatch = testProducts.find(p => p.name === "Luxury Watch (High Ticket)");
    if (luxuryWatch) {
      console.log("4️⃣  Luxury Watch (High Ticket) - Test Results:");
      console.log(`   ✅ Base Price: $${(luxuryWatch.price / 100).toFixed(2)}`);
      console.log(`   ${luxuryWatch.compareAtPrice ? '✅' : '❌'} Compare Price: $${(luxuryWatch.compareAtPrice / 100).toFixed(2)}`);

      const discount = Math.round((1 - luxuryWatch.price / luxuryWatch.compareAtPrice) * 100);
      console.log(`   ✅ Discount: ${discount}% (expected 40%)`);
      console.log(`   ${luxuryWatch.shippingPrice ? '✅' : '❌'} Shipping: $${(luxuryWatch.shippingPrice / 100).toFixed(2)}`);
      console.log(`   ${!luxuryWatch.hasVariants ? '✅' : '❌'} No variants: ${!luxuryWatch.hasVariants ? 'PASSED' : 'FAILED'}`);
      console.log(`   High ticket item: ${luxuryWatch.price >= 50000 ? '✅ PASSED' : '❌ FAILED'}`);
      console.log("");
    }

    // Overall Summary
    console.log("=" .repeat(60));
    console.log("📊 Test Summary:\n");

    const tests = [
      { name: "Basic T-Shirt", result: basicTshirt && !basicTshirt.compareAtPrice && basicTshirt.variants?.length === 4 },
      { name: "Premium Jacket", result: premiumJacket && premiumJacket.compareAtPrice && premiumJacket.shippingPrice },
      { name: "Designer Shoes", result: designerShoes && designerShoes.variants?.length === 10 && new Set(designerShoes.variants.map(v => v.price)).size > 1 },
      { name: "Luxury Watch", result: luxuryWatch && !luxuryWatch.hasVariants && luxuryWatch.price >= 50000 }
    ];

    tests.forEach(test => {
      console.log(`${test.result ? '✅' : '❌'} ${test.name}: ${test.result ? 'PASSED' : 'FAILED'}`);
    });

    const allPassed = tests.every(t => t.result);
    console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

    console.log("\n=" .repeat(60));
    console.log("\n🌐 Next Steps:");
    console.log("   1. View products in admin: http://localhost:3004/admin/products");
    console.log("   2. View products in shop: http://localhost:3004/shop");
    console.log("   3. Test variant selection and price updates in shop");
    console.log("   4. Verify discount badges display correctly");
    console.log("   5. Check shipping costs are added to cart total\n");

  } catch (error) {
    console.error("\n❌ Verification failed:", error.message);
    console.error(error);
  }
}

verifyPriceVariations().catch(console.error);
