"use client";

import { useCart } from "@/contexts/CartContext";
import { X, Trash2, Plus, Minus, ShoppingBag, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ShoppingCart() {
  const { items, removeFromCart, updateQuantity, getSubtotal, isCartOpen, setIsCartOpen } =
    useCart();

  const router = useRouter();

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push("/shop/checkout");
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Cart Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping Cart</h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Package className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add some products to get started
              </p>
              <Link
                href="/shop"
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  {/* Product Image */}
                  <div className="relative w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                      {item.productName}
                    </h3>
                    {item.variantName && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                        {item.variantName}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      ${(item.productPrice / 100).toFixed(2)} each
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 font-semibold min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      ${((item.productPrice * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-6 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-lg">
              <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
              <span className="font-bold text-gray-900 dark:text-white">
                ${(getSubtotal() / 100).toFixed(2)}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Shipping and taxes calculated at checkout
            </p>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              className="w-full px-6 py-4 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Proceed to Checkout
            </button>

            {/* Continue Shopping */}
            <Link
              href="/shop"
              onClick={() => setIsCartOpen(false)}
              className="block text-center text-primary hover:underline font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
