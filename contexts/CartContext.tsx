"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Id } from '@/convex/_generated/dataModel';

export interface SelectedProductOption {
  optionId: string;
  optionName: string;
  type: string;
  value?: string | number | string[];
  priceModifier: number;
  selectedChoices?: Array<{
    id: string;
    label: string;
    priceModifier: number;
  }>;
}

export interface CartItem {
  productId: Id<"products">;
  productName: string;
  productPrice: number; // Base/variant price + options price modifier
  productImage?: string;
  quantity: number;
  variantId?: string;
  variantName?: string;
  variantOptions?: {size?: string; color?: string};
  productOptions?: SelectedProductOption[]; // Product customization options
  optionsPriceModifier?: number; // Total price from options
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: Id<"products">) => void;
  updateQuantity: (productId: Id<"products">, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addToCart = (newItem: CartItem) => {
    setItems(currentItems => {
      // Check if item already exists in cart (match by productId, variantId, AND productOptions)
      const existingItemIndex = currentItems.findIndex(item => {
        // Must match productId and variantId
        if (item.productId !== newItem.productId) return false;
        if (item.variantId !== newItem.variantId) return false;

        // Must have same product options (or both have none)
        const itemOptionsJson = JSON.stringify(item.productOptions || []);
        const newItemOptionsJson = JSON.stringify(newItem.productOptions || []);
        return itemOptionsJson === newItemOptionsJson;
      });

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity
        };
        return updatedItems;
      } else {
        // Add new item
        return [...currentItems, newItem];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: Id<"products">) => {
    setItems(currentItems =>
      currentItems.filter(item => item.productId !== productId)
    );
  };

  const updateQuantity = (productId: Id<"products">, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemCount,
        getSubtotal,
        isCartOpen,
        setIsCartOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
