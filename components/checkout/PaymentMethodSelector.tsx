/**
 * Unified Payment Method Selector Component
 *
 * Consolidated payment method selection that respects payment hierarchy:
 * - Organizer Level: Configure merchant processor + enable/disable methods
 * - Staff Level: Toggle cash acceptance only
 *
 * Features:
 * - Automatically hides unavailable methods
 * - Shows appropriate payment processor logo
 * - Displays cash requirements (staff approval, 30-min hold)
 * - Accessibility compliant (keyboard navigation, ARIA labels)
 */

import { CreditCard, Smartphone, Banknote, AlertCircle } from "lucide-react";
import type {
  PaymentMethod,
  MerchantProcessor,
  AvailablePaymentMethods,
} from "@/lib/checkout/payment-availability";
import {
  getPaymentMethodDisplayName,
  getMerchantProcessorDisplayName,
} from "@/lib/checkout/payment-availability";

export interface PaymentMethodSelectorProps {
  /** Available payment methods based on config */
  availableMethods: AvailablePaymentMethods;
  /** Currently selected payment method */
  selectedMethod: PaymentMethod;
  /** Callback when payment method changes */
  onMethodChange: (method: PaymentMethod) => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Get icon component for payment method
 */
function getPaymentMethodIcon(method: PaymentMethod) {
  switch (method) {
    case "card":
      return CreditCard;
    case "cashapp":
      return Smartphone;
    case "cash":
      return Banknote;
    default:
      return CreditCard;
  }
}

/**
 * Get description for payment method
 */
function getPaymentMethodDescription(method: PaymentMethod, processor?: MerchantProcessor): string {
  switch (method) {
    case "card":
      return processor
        ? `Pay securely with ${getMerchantProcessorDisplayName(processor)}`
        : "Pay securely with your credit or debit card";
    case "cashapp":
      return "Scan QR code to pay with Cash App";
    case "cash":
      return "Pay with cash when picking up your tickets (requires staff approval)";
    default:
      return "";
  }
}

export function PaymentMethodSelector({
  availableMethods,
  selectedMethod,
  onMethodChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const methods: PaymentMethod[] = [];

  if (availableMethods.creditCard) methods.push("card");
  if (availableMethods.cashApp) methods.push("cashapp");
  if (availableMethods.cash) methods.push("cash");

  // If no methods available, show error state
  if (methods.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">No Payment Methods Available</h3>
            <p className="text-sm text-yellow-800">
              The organizer has not configured any payment methods for this event. Please contact
              the event organizer for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>

      {/* Payment Method Options */}
      <div className="space-y-3">
        {methods.map((method) => {
          const Icon = getPaymentMethodIcon(method);
          const isSelected = selectedMethod === method;
          const description = getPaymentMethodDescription(
            method,
            availableMethods.merchantProcessor
          );

          return (
            <button
              key={method}
              type="button"
              onClick={() => onMethodChange(method)}
              disabled={disabled}
              className={`
                w-full p-4 border-2 rounded-lg text-left transition-all
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  isSelected
                    ? "border-primary bg-accent/50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }
              `}
              aria-pressed={isSelected}
              aria-label={`Pay with ${getPaymentMethodDisplayName(method)}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`
                    w-12 h-12 rounded-lg flex items-center justify-center shrink-0
                    ${isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}
                  `}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className={`font-semibold ${isSelected ? "text-primary" : "text-gray-900"}`}
                    >
                      {getPaymentMethodDisplayName(method)}
                    </h4>
                    {isSelected && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{description}</p>

                  {/* Cash-specific warnings */}
                  {method === "cash" && (
                    <div className="mt-2 p-2 bg-accent/50 border border-border rounded text-xs text-foreground">
                      <strong>Note:</strong> Your order will be held for 30 minutes. Staff must
                      approve your payment within this time.
                    </div>
                  )}
                </div>

                {/* Selection Indicator */}
                <div
                  className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                    ${isSelected ? "border-primary" : "border-gray-300"}
                  `}
                >
                  {isSelected && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Processor Info */}
      {availableMethods.merchantProcessor && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            Payments processed securely by{" "}
            <span className="font-semibold">
              {getMerchantProcessorDisplayName(availableMethods.merchantProcessor)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
