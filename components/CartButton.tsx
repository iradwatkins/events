"use client";

import { useCart } from "@/contexts/CartContext";
import { ShoppingCart } from "lucide-react";

export function CartButton() {
  const { getItemCount, setIsCartOpen } = useCart();
  const itemCount = getItemCount();

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      aria-label="Shopping cart"
    >
      <ShoppingCart className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </button>
  );
}
