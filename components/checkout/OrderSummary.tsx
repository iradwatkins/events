/**
 * Order Summary Component
 *
 * Consistent order summary display across all checkout types
 *
 * Features:
 * - Itemized list with quantities
 * - Collapsible fee breakdown
 * - Mobile-optimized layout
 * - Visual hierarchy (subtotal → fees → total)
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { formatCurrency } from "@/lib/checkout/calculate-fees";

export interface OrderItem {
  /** Item name/description */
  name: string;
  /** Quantity */
  quantity: number;
  /** Price per unit in cents */
  pricePerUnit: number;
  /** Optional description/details */
  description?: string;
}

export interface OrderFees {
  /** Platform fee in cents */
  platform?: number;
  /** Payment processing fee in cents */
  processing?: number;
}

export interface OrderSummaryProps {
  /** Line items */
  items: OrderItem[];
  /** Subtotal in cents (before fees) */
  subtotal: number;
  /** Fee breakdown */
  fees: OrderFees;
  /** Total amount in cents */
  total: number;
  /** Show detailed fee breakdown */
  showFeeBreakdown?: boolean;
  /** Discount amount in cents (if any) */
  discountAmount?: number;
  /** Discount code used */
  discountCode?: string;
  /** Callback to remove discount */
  onRemoveDiscount?: () => void;
}

export function OrderSummary({
  items,
  subtotal,
  fees,
  total,
  showFeeBreakdown = true,
  discountAmount = 0,
  discountCode,
  onRemoveDiscount,
}: OrderSummaryProps) {
  const [feeBreakdownExpanded, setFeeBreakdownExpanded] = useState(false);

  const hasFees = (fees.platform || 0) + (fees.processing || 0) > 0;
  const subtotalAfterDiscount = subtotal - discountAmount;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

      {/* Line Items */}
      <div className="space-y-3 pb-4 border-b border-gray-200">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-4">
              <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 truncate">{item.description}</p>
              )}
              <p className="text-sm text-gray-500">
                {item.quantity} × {formatCurrency(item.pricePerUnit)}
              </p>
            </div>
            <div className="font-semibold text-gray-900 shrink-0">
              {formatCurrency(item.quantity * item.pricePerUnit)}
            </div>
          </div>
        ))}
      </div>

      {/* Subtotal */}
      <div className="py-4 space-y-2">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>

        {/* Discount */}
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <div className="flex items-center gap-2">
              <span>Discount</span>
              {discountCode && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  {discountCode}
                </span>
              )}
              {onRemoveDiscount && (
                <button
                  onClick={onRemoveDiscount}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Remove
                </button>
              )}
            </div>
            <span className="font-medium">-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        {/* Subtotal After Discount */}
        {discountAmount > 0 && (
          <div className="flex justify-between text-gray-700 pt-2 border-t border-gray-200">
            <span>Subtotal after discount</span>
            <span className="font-medium">{formatCurrency(subtotalAfterDiscount)}</span>
          </div>
        )}
      </div>

      {/* Fees Section */}
      {hasFees && (
        <div className="py-4 border-t border-gray-200">
          <button
            onClick={() => setFeeBreakdownExpanded(!feeBreakdownExpanded)}
            className="w-full flex items-center justify-between text-gray-700 hover:text-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>Fees</span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {formatCurrency((fees.platform || 0) + (fees.processing || 0))}
              </span>
              {showFeeBreakdown && (
                <div className="text-gray-400">
                  {feeBreakdownExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              )}
            </div>
          </button>

          {/* Fee Breakdown (Collapsible) */}
          {showFeeBreakdown && feeBreakdownExpanded && (
            <div className="mt-3 pl-4 space-y-2 text-sm">
              {fees.platform && fees.platform > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Platform fee</span>
                  <span>{formatCurrency(fees.platform)}</span>
                </div>
              )}
              {fees.processing && fees.processing > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Processing fee</span>
                  <span>{formatCurrency(fees.processing)}</span>
                </div>
              )}
              <div className="pt-2 text-xs text-gray-500">
                Platform and processing fees support secure payment processing and event management.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="pt-4 border-t-2 border-gray-300">
        <div className="flex justify-between items-baseline">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
        </div>
        {hasFees && <p className="text-xs text-gray-500 mt-1 text-right">All fees included</p>}
      </div>
    </div>
  );
}

/**
 * Compact Order Summary for mobile/small spaces
 */
export function CompactOrderSummary({ items, total }: Pick<OrderSummaryProps, "items" | "total">) {
  const [expanded, setExpanded] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="text-left">
          <div className="text-sm text-gray-600">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </div>
          <div className="text-lg font-bold text-primary">{formatCurrency(total)}</div>
        </div>
        <div className="text-gray-400">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.quantity}× {item.name}
              </span>
              <span className="font-medium text-gray-900">
                {formatCurrency(item.quantity * item.pricePerUnit)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
