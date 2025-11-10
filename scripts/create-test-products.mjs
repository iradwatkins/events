#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud");

const testProducts = [
  {
    name: "Classic Cotton T-Shirt",
    description: "Comfortable and breathable cotton t-shirt perfect for everyday wear. Made from 100% organic cotton.",
    price: 2499, // $24.99
    compareAtPrice: 3999,
    sku: "TSHIRT-001",
    inventoryQuantity: 100,
    trackInventory: true,
    category: "Apparel",
    tags: ["clothing", "casual", "cotton"],
    hasVariants: true,
    requiresShipping: true,
    weight: 200,
    status: "ACTIVE",
    colors: ["Black", "White", "Navy", "Gray"],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Premium Hoodie",
    description: "Warm and cozy fleece hoodie with kangaroo pocket and adjustable drawstring hood.",
    price: 5499, // $54.99
    compareAtPrice: 7999,
    sku: "HOODIE-001",
    inventoryQuantity: 75,
    trackInventory: true,
    category: "Apparel",
    tags: ["clothing", "winter", "casual"],
    hasVariants: true,
    requiresShipping: true,
    weight: 500,
    status: "ACTIVE",
    colors: ["Black", "Gray", "Navy"],
    sizes: ["M", "L", "XL", "XXL"]
  },
  {
    name: "Athletic Shorts",
    description: "Lightweight and moisture-wicking athletic shorts perfect for workouts and running.",
    price: 3299, // $32.99
    sku: "SHORTS-001",
    inventoryQuantity: 80,
    trackInventory: true,
    category: "Apparel",
    tags: ["athletic", "sportswear"],
    hasVariants: true,
    requiresShipping: true,
    weight: 150,
    status: "ACTIVE",
    colors: ["Black", "Navy", "Red", "Blue"],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Denim Jeans",
    description: "Classic fit denim jeans with five-pocket styling. Durable and comfortable for all-day wear.",
    price: 6999, // $69.99
    compareAtPrice: 9999,
    sku: "JEANS-001",
    inventoryQuantity: 60,
    trackInventory: true,
    category: "Apparel",
    tags: ["clothing", "denim", "casual"],
    hasVariants: true,
    requiresShipping: true,
    weight: 600,
    shippingPrice: 799,
    status: "ACTIVE",
    colors: ["Dark Wash", "Light Wash", "Black"],
    sizes: ["28", "30", "32", "34", "36"]
  },
  {
    name: "Polo Shirt",
    description: "Classic polo shirt with collar and two-button placket. Perfect for business casual or weekend wear.",
    price: 3999, // $39.99
    compareAtPrice: 5999,
    sku: "POLO-001",
    inventoryQuantity: 90,
    trackInventory: true,
    category: "Apparel",
    tags: ["clothing", "business casual", "polo"],
    hasVariants: true,
    requiresShipping: true,
    weight: 250,
    status: "ACTIVE",
    colors: ["White", "Navy", "Black", "Red"],
    sizes: ["S", "M", "L", "XL"]
  }
];

async function createProducts() {
  console.log("🚀 Creating test products with variants...\n");

  for (const productData of testProducts) {
    try {
      const { colors, sizes, ...baseProductData } = productData;

      console.log(`Creating: ${productData.name}...`);

      // Create the base product
      const productId = await client.mutation(api.products.mutations.createProduct, baseProductData);
      console.log(`✅ Product created with ID: ${productId}`);

      // Generate variants
      if (colors && sizes) {
        const result = await client.mutation(api.products.mutations.generateVariantCombinations, {
          productId,
          colors,
          sizes,
          basePrice: productData.price,
          baseSku: productData.sku
        });
        console.log(`✅ Generated ${result.variantsCreated} variants (${colors.length} colors × ${sizes.length} sizes)`);
      }

      console.log("");
    } catch (error) {
      console.error(`❌ Error creating ${productData.name}:`, error.message);
      console.log("");
    }
  }

  console.log("✅ All test products created successfully!");
  console.log("\n📝 Summary:");
  console.log(`- ${testProducts.length} products created`);
  console.log(`- Each with color and size variants`);
  console.log(`- Total variants: ${testProducts.reduce((sum, p) => sum + (p.colors?.length || 0) * (p.sizes?.length || 0), 0)}`);
  console.log("\n🔗 View products at: http://localhost:3004/admin/products");
  console.log("🛍️  Shop view: http://localhost:3004/shop");
}

createProducts().catch(console.error);
