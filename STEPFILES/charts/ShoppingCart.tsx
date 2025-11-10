// components/ShoppingCart.tsx
import React from 'react';
import { Button } from './ui/button';
import { ShoppingCart as CartIcon, X, CreditCard } from 'lucide-react';

interface CartItem {
  id: string;
  tableId: number;
  seatNumber: number;
  type: 'regular' | 'vip';
  price: number;
}

interface ShoppingCartProps {
  cart: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  regularPrice: number;
  vipPrice: number;
  onPriceChange: (type: 'regular' | 'vip', value: number) => void;
  isSellingMode: boolean;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  cart,
  onRemoveItem,
  onClearCart,
  onCheckout,
  regularPrice,
  vipPrice,
  onPriceChange,
  isSellingMode
}) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 flex flex-col h-full max-h-[calc(100vh-250px)] sticky top-5">
      {/* Header */}
      <div className="flex items-center gap-2 pb-5 border-b-2 border-purple-500 mb-5">
        <CartIcon className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-gray-800">Shopping Cart</h2>
      </div>

      {/* Price Settings (Selling Mode) */}
      {isSellingMode && (
        <div className="mb-5 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">💰 Ticket Prices</h4>
          
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-gray-600 min-w-[85px]">Regular:</label>
            <input
              type="number"
              value={regularPrice}
              onChange={(e) => onPriceChange('regular', parseInt(e.target.value) || 0)}
              className="w-[70px] px-2 py-1 border-2 border-gray-300 rounded text-sm font-semibold focus:border-purple-500 focus:outline-none"
              min="1"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 min-w-[85px]">VIP:</label>
            <input
              type="number"
              value={vipPrice}
              onChange={(e) => onPriceChange('vip', parseInt(e.target.value) || 0)}
              className="w-[70px] px-2 py-1 border-2 border-gray-300 rounded text-sm font-semibold focus:border-purple-500 focus:outline-none"
              min="1"
            />
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto mb-5">
        {cart.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-5xl mb-3">🎫</div>
            <p className="font-medium">No tickets selected</p>
            <p className="text-sm mt-2">Click on seats to add them</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3 flex items-center justify-between hover:border-purple-500 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 text-sm">
                    {item.type === 'vip' ? '👑 VIP' : '🎫'} Table {item.tableId} - Seat {item.seatNumber}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.type.toUpperCase()}
                  </div>
                </div>
                <span className="font-bold text-primary mr-2">${item.price}</span>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-sm font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border-t-2 border-gray-200 pt-5">
        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-gray-700">
            <span>Tickets:</span>
            <span className="font-semibold">{cart.length}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span className="font-semibold">${subtotal}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Tax (10%):</span>
            <span className="font-semibold">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-900 text-lg font-bold border-t-2 border-purple-500 pt-3 mt-2">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Buttons */}
        {isSellingMode && (
          <>
            <Button
              onClick={onCheckout}
              disabled={cart.length === 0}
              className="w-full mb-2 h-12 text-base font-bold"
              variant="default"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Proceed to Checkout
            </Button>
            <Button
              onClick={onClearCart}
              variant="outline"
              className="w-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white h-10"
            >
              Clear Cart
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
