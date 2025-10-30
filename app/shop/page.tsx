"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Package, ShoppingCart, DollarSign } from "lucide-react";
import Link from "next/link";

export default function ShopPage() {
  const products = useQuery(api.products.queries.getActiveProducts, {});

  if (!products) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SteppersLife Shop</h1>
              <p className="text-gray-600 mt-1">Official merchandise and products</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon!</h2>
            <p className="text-gray-600">
              Our shop is currently being stocked with amazing products. Check back soon!
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
              <p className="text-gray-600">
                {products.length} {products.length === 1 ? "product" : "products"} available
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 relative">
                    {product.primaryImage ? (
                      <img
                        src={product.primaryImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-600">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-xl font-bold text-gray-900">
                        ${(product.price / 100).toFixed(2)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${(product.compareAtPrice / 100).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {product.trackInventory && (
                      <div className="text-sm text-gray-600 mb-4">
                        {product.inventoryQuantity > 0 ? (
                          <span className="text-green-600">
                            {product.inventoryQuantity} in stock
                          </span>
                        ) : (
                          <span className="text-red-600">Out of stock</span>
                        )}
                      </div>
                    )}

                    {product.category && (
                      <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded mb-4">
                        {product.category}
                      </span>
                    )}

                    {/* Add to Cart Button */}
                    <button
                      disabled={product.trackInventory && product.inventoryQuantity === 0}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {product.trackInventory && product.inventoryQuantity === 0
                        ? "Out of Stock"
                        : "Add to Cart"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Note */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-900 font-medium">
            Shopping cart and checkout functionality coming soon!
          </p>
          <p className="text-blue-700 text-sm mt-2">
            Currently accepting orders through our admin panel. Contact us to place an order.
          </p>
        </div>
      </footer>
    </div>
  );
}
