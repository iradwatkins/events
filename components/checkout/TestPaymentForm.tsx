"use client";

import { useState } from "react";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";

interface TestPaymentFormProps {
  amount: number; // in cents
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  orderId: string;
  eventName: string;
  buyerEmail: string;
}

export function TestPaymentForm({
  amount,
  onPaymentSuccess,
  onPaymentError,
  orderId,
  eventName,
  buyerEmail,
}: TestPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const handlePayment = async () => {
    // Basic validation
    if (!cardNumber || !expiry || !cvv) {
      onPaymentError("Please fill in all card details");
      return;
    }

    if (cardNumber.length < 16) {
      onPaymentError("Invalid card number");
      return;
    }

    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      // Generate test payment ID
      const testPaymentId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // Simulate success (you can add failure scenarios based on card number)
      if (cardNumber === "4242424242424242") {
        onPaymentSuccess(testPaymentId);
      } else if (cardNumber.startsWith("4")) {
        // Any other card starting with 4 succeeds
        onPaymentSuccess(testPaymentId);
      } else {
        setIsProcessing(false);
        onPaymentError("Card declined - use test card 4242424242424242");
      }
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="space-y-6">
      {/* Test Mode Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-900">Test Mode Active</p>
            <p className="text-xs text-yellow-800 mt-1">
              Use card number: <code className="bg-yellow-100 px-1 rounded">4242 4242 4242 4242</code>
              <br />
              Use any future expiry date and any 3-digit CVV
            </p>
          </div>
        </div>
      </div>

      {/* Card Details Form */}
      <div className="space-y-4">
        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <CreditCard className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Expiry and CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              maxLength={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVV
            </label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").substring(0, 3))}
              placeholder="123"
              maxLength={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all ${
          isProcessing
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay ${(amount / 100).toFixed(2)}
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Test Mode - No real charges</span>
      </div>
    </div>
  );
}
