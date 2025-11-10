#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud");

const priceTestProducts = [
  {
    name: "Basic T-Shirt (No Sale)",
    description: "Simple pricing - no compare price, no variants with different prices",
    price: 1999, // $19.99
    sku: "BASIC-TSH-001",
    inventoryQuantity: 50,
    trackInventory: true,
    category: "Apparel",
    tags: ["basic", "t-shirt"],
    hasVariants: true,
    requiresShipping: true,
    weight: 200,
    status: "ACTIVE",
    primaryImage: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
    colors: ["Black", "White"],
    sizes: ["M", "L"],
    variantPriceModifier: 0 // All variants same price
  },
  {
    name: "Premium Jacket (On Sale)",
    description: "Has compare-at price showing discount percentage",
    price: 7999, // $79.99
    compareAtPrice: 12999, // Was $129.99 (38% off)
    sku: "PREM-JKT-001",
    inventoryQuantity: 30,
    trackInventory: true,
    category: "Apparel",
    tags: ["premium", "jacket", "sale"],
    hasVariants: true,
    requiresShipping: true,
    weight: 800,
    shippingPrice: 599, // $5.99 shipping
    status: "ACTIVE",
    primaryImage: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop",
    colors: ["Navy", "Black", "Gray"],
    sizes: ["S", "M", "L", "XL"],
    variantPriceModifier: 0
  },
  {
    name: "Designer Shoes (Variable Pricing)",
    description: "Different prices per size - larger sizes cost more",
    price: 8999, // Base: $89.99 (size S)
    compareAtPrice: 11999, // Was $119.99
    sku: "DESIGN-SHOE-001",
    inventoryQuantity: 40,
    trackInventory: true,
    category: "Footwear",
    tags: ["designer", "shoes", "premium"],
    hasVariants: true,
    requiresShipping: true,
    weight: 600,
    shippingPrice: 799, // $7.99 shipping
    status: "ACTIVE",
    primaryImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop",
    colors: ["Black", "Brown"],
    sizes: ["8", "9", "10", "11", "12"],
    variantPricing: {
      "8": 8999,   // $89.99
      "9": 9499,   // $94.99
      "10": 9999,  // $99.99
      "11": 10499, // $104.99
      "12": 10999  // $109.99
    }
  },
  {
    name: "Luxury Watch (High Ticket)",
    description: "No variants, high price point with significant discount",
    price: 59999, // $599.99
    compareAtPrice: 99999, // Was $999.99 (40% off)
    sku: "LUX-WATCH-001",
    inventoryQuantity: 5,
    trackInventory: true,
    category: "Accessories",
    tags: ["luxury", "watch", "premium"],
    hasVariants: false,
    requiresShipping: true,
    weight: 300,
    shippingPrice: 1999, // $19.99 shipping
    status: "ACTIVE",
    primaryImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop"
  }
];

async function createPriceTestProducts() {
  console.log("💰 Creating Price Variation Test Products\n");
  console.log("=" .repeat(60) + "\n");

  for (const productData of priceTestProducts) {
    try {
      const { colors, sizes, variantPricing, variantPriceModifier, ...baseProductData } = productData;

      console.log(`Creating: ${productData.name}...`);
      console.log(`  Base Price: $${(productData.price / 100).toFixed(2)}`);
      if (productData.compareAtPrice) {
        const discount = Math.round((1 - productData.price / productData.compareAtPrice) * 100);
        console.log(`  Compare Price: $${(productData.compareAtPrice / 100).toFixed(2)} (${discount}% off)`);
      }
      if (productData.shippingPrice) {
        console.log(`  Shipping: $${(productData.shippingPrice / 100).toFixed(2)}`);
      }

      // Create the base product
      const productId = await client.mutation(api.products.mutations.createProduct, baseProductData);
      console.log(`✅ Product created with ID: ${productId}`);

      // Generate variants with custom pricing
      if (colors && sizes) {
        if (variantPricing) {
          // Manual variant creation with different prices per size
          console.log(`  Creating variants with variable pricing...`);
          let variantCount = 0;

          for (const color of colors) {
            for (const size of sizes) {
              const variantPrice = variantPricing[size] || productData.price;
              const variantName = `${color} / ${size}`;
              const variantSku = `${productData.sku}-${color.toUpperCase()}-${size}`;

              await client.mutation(api.products.mutations.addProductVariant, {
                productId,
                variant: {
                  name: variantName,
                  sku: variantSku,
                  price: variantPrice,
                  options: { color, size },
                  inventoryQuantity: productData.inventoryQuantity
                }
              });

              variantCount++;
            }
          }
          console.log(`✅ Created ${variantCount} variants with variable pricing`);
          console.log(`   Price range: $${(productData.price / 100).toFixed(2)} - $${(Math.max(...Object.values(variantPricing)) / 100).toFixed(2)}`);
        } else {
          // Standard variant generation (all same price)
          const result = await client.mutation(api.products.mutations.generateVariantCombinations, {
            productId,
            colors,
            sizes,
            basePrice: productData.price,
            baseSku: productData.sku
          });
          console.log(`✅ Generated ${result.variantsCreated} variants (${colors.length} colors × ${sizes.length} sizes)`);
          console.log(`   All variants: $${(productData.price / 100).toFixed(2)}`);
        }
      } else {
        console.log(`  No variants (single product)`);
      }

      console.log("");
    } catch (error) {
      console.error(`❌ Error creating ${productData.name}:`, error.message);
      console.log("");
    }
  }

  console.log("=" .repeat(60));
  console.log("✅ Price Test Products Created!\n");

  // Verify and display summary
  const allProducts = await client.query(api.products.queries.getAllProducts, { status: "ACTIVE" });
  const testProducts = allProducts.filter(p =>
    p.name.includes("Basic T-Shirt") ||
    p.name.includes("Premium Jacket") ||
    p.name.includes("Designer Shoes") ||
    p.name.includes("Luxury Watch")
  );

  console.log("📊 Price Test Summary:\n");

  for (const product of testProducts) {
    console.log(`${product.name}:`);
    console.log(`  Price: $${(product.price / 100).toFixed(2)}`);

    if (product.compareAtPrice) {
      const discount = Math.round((1 - product.price / product.compareAtPrice) * 100);
      console.log(`  Was: $${(product.compareAtPrice / 100).toFixed(2)} (Save ${discount}%)`);
    }

    if (product.shippingPrice) {
      console.log(`  Shipping: +$${(product.shippingPrice / 100).toFixed(2)}`);
    }

    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.price).filter(Boolean);
      const uniquePrices = [...new Set(prices)];

      if (uniquePrices.length > 1) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        console.log(`  Variants: ${product.variants.length} (prices vary: $${(minPrice / 100).toFixed(2)} - $${(maxPrice / 100).toFixed(2)})`);
      } else {
        console.log(`  Variants: ${product.variants.length} (all $${(product.price / 100).toFixed(2)})`);
      }
    } else {
      console.log(`  Variants: None`);
    }

    console.log(`  ID: ${product._id}`);
    console.log("");
  }

  console.log("=" .repeat(60));
  console.log("\n🧪 Test These Scenarios:\n");
  console.log("1. Basic T-Shirt:");
  console.log("   - No sale price (no compare-at price)");
  console.log("   - All variants same price\n");

  console.log("2. Premium Jacket:");
  console.log("   - Shows 38% discount badge");
  console.log("   - Has shipping cost ($5.99)");
  console.log("   - All variants same price\n");

  console.log("3. Designer Shoes:");
  console.log("   - Variable pricing by size");
  console.log("   - Price increases with shoe size");
  console.log("   - Shows discount on all variants\n");

  console.log("4. Luxury Watch:");
  console.log("   - High ticket item ($599.99)");
  console.log("   - 40% discount shown");
  console.log("   - No variants");
  console.log("   - Premium shipping ($19.99)\n");

  console.log("🌐 View products:");
  console.log(`  - Admin: http://localhost:3004/admin/products`);
  console.log(`  - Shop: http://localhost:3004/shop`);
  if (testProducts.length > 0) {
    console.log(`  - Example: http://localhost:3004/shop/${testProducts[0]._id}`);
  }
}

createPriceTestProducts().catch(console.error);
