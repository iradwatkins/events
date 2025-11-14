"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Package, ShoppingCart, DollarSign } from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function ShopPage() {
  const products = useQuery(api.products.queries.getActiveProducts, {});

  if (!products) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SteppersLife Shop</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Official merchandise and products
            </p>
          </div>

          {products.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Coming Soon!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Our shop is currently being stocked with amazing products. Check back soon!
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Products</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {products.length} {products.length === 1 ? "product" : "products"} available
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                      {product.primaryImage ? (
                        <img
                          src={product.primaryImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          ${(product.price / 100).toFixed(2)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                            ${(product.compareAtPrice / 100).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {product.trackInventory && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {product.inventoryQuantity > 0 ? (
                            <span className="text-green-600 dark:text-green-400">
                              {product.inventoryQuantity} in stock
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">Out of stock</span>
                          )}
                        </div>
                      )}

                      {product.category && (
                        <span className="inline-block px-2 py-1 bg-accent text-primary text-xs rounded mb-4">
                          {product.category}
                        </span>
                      )}

                      {/* Add to Cart Button */}
                      <Link
                        href={`/shop/${product._id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        View Product
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer Note */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-accent dark:bg-accent/10 border border-border rounded-lg p-6 text-center">
            <p className="text-foreground font-medium">
              Shopping cart and checkout functionality coming soon!
            </p>
            <p className="text-primary text-sm mt-2">
              Currently accepting orders through our admin panel. Contact us to place an order.
            </p>
          </div>
        </footer>
        <PublicFooter />
      </div>
    </>
  );
}
