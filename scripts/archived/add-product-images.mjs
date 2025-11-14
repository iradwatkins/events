#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud");

// Unsplash images for different product types
const productImages = {
  "Classic Cotton T-Shirt": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
  "Premium Hoodie": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop",
  "Athletic Shorts": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=800&fit=crop",
  "Denim Jeans": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop",
  "Polo Shirt": "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&h=800&fit=crop"
};

async function addProductImages() {
  console.log("🖼️  Adding Unsplash Images to Test Products\n");
  console.log("=" .repeat(60) + "\n");

  try {
    // Get all products
    const products = await client.query(api.products.queries.getAllProducts, {});
    console.log(`📦 Found ${products.length} products\n`);

    let updatedCount = 0;

    for (const product of products) {
      // Check if product name matches our test products
      const imageUrl = productImages[product.name];

      if (imageUrl && !product.primaryImage) {
        console.log(`🎨 Updating "${product.name}"...`);

        try {
          await client.mutation(api.products.mutations.updateProduct, {
            productId: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            sku: product.sku,
            inventoryQuantity: product.inventoryQuantity,
            trackInventory: product.trackInventory,
            category: product.category,
            tags: product.tags,
            primaryImage: imageUrl,
            hasVariants: product.hasVariants,
            requiresShipping: product.requiresShipping,
            weight: product.weight,
            shippingPrice: product.shippingPrice,
            status: product.status
          });

          console.log(`✅ Added image: ${imageUrl.substring(0, 60)}...`);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Failed to update ${product.name}:`, error.message);
        }
      } else if (imageUrl && product.primaryImage) {
        console.log(`ℹ️  "${product.name}" already has an image`);
      }

      console.log("");
    }

    console.log("=" .repeat(60));
    console.log(`✅ Updated ${updatedCount} products with Unsplash images`);
    console.log("=" .repeat(60));
    console.log("\n🌐 View updated products:");
    console.log(`  - Admin Panel: http://localhost:3004/admin/products`);
    console.log(`  - Shop View: http://localhost:3004/shop`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  }
}

addProductImages().catch(console.error);
