"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, CreditCard, Check, Loader2 } from "lucide-react";
import { PayPalPayment } from "../checkout/PayPalPayment";

interface Package {
  credits: number;
  price: number;
  popular?: boolean;
}

const PACKAGES: Package[] = [
  { credits: 500, price: 150 },
  { credits: 1000, price: 300, popular: true },
  { credits: 2500, price: 750 },
];

interface PurchaseCreditsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function PurchaseCreditsModal({ onClose, onSuccess }: PurchaseCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<Package>(PACKAGES[1]); // Default to popular
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user ID
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.user._id) {
          setUserId(data.user._id);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        setError("Failed to load user information");
      });
  }, []);

  useEffect(() => {
    // Load Square Web SDK
    const script = document.createElement("script");
    script.src = "https://web.squarecdn.com/v1/square.js";
    script.async = true;
    script.onload = initializeSquare;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function initializeSquare() {
    const Square = (window as any).Square;
    if (!Square) {
      console.error("Square.js failed to load");
      return;
    }

    try {
      const payments = Square.payments(
        process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!,
        process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
      );

      const cardElement = await payments.card();
      await cardElement.attach("#card-container");
      setCard(cardElement);
    } catch (error) {
      console.error("Failed to initialize Square payments:", error);
      setError("Failed to load payment form. Please try again.");
    }
  }

  async function handlePurchase() {
    if (!card) {
      setError("Payment form not loaded. Please refresh the page.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Tokenize card
      const result = await card.tokenize();

      if (result.status === "OK") {
        const token = result.token;

        // Process payment via API
        const response = await fetch("/api/credits/purchase-with-square", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            credits: selectedPackage.credits,
            sourceId: token,
            verificationToken: result.details?.verificationToken,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.success) {
            // Success!
            onSuccess();
            onClose();
          } else {
            setError(data.error || "Payment failed");
          }
        } else {
          setError(data.error || "Payment processing failed");
        }
      } else {
        // Tokenization failed
        const errors = result.errors || [];
        setError(errors[0]?.message || "Card validation failed");
      }
    } catch (err: any) {
      console.error("Purchase error:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase More Credits</h2>
          <p className="text-gray-600">Choose the package that fits your needs</p>
        </div>

        {/* Package Selection */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.credits}
              onClick={() => setSelectedPackage(pkg)}
              className={`border-2 rounded-lg p-6 hover:shadow-lg transition-all text-center relative ${
                selectedPackage.credits === pkg.credits
                  ? "border-primary bg-accent"
                  : "border-gray-200 hover:border-primary"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                  POPULAR
                </div>
              )}
              <p className="text-3xl font-bold text-gray-900 mb-2">{pkg.credits}</p>
              <p className="text-sm text-gray-600 mb-3">tickets</p>
              <p className="text-2xl font-bold text-primary mb-2">${pkg.price}</p>
              <p className="text-xs text-gray-500">$0.30 per ticket</p>
              {selectedPackage.credits === pkg.credits && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod("card")}
              className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all ${
                paymentMethod === "card"
                  ? "border-primary bg-accent"
                  : "border-gray-200 hover:border-primary"
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="font-medium">Credit Card</span>
            </button>
            <button
              onClick={() => setPaymentMethod("paypal")}
              className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all ${
                paymentMethod === "paypal"
                  ? "border-primary bg-accent"
                  : "border-gray-200 hover:border-primary"
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.16a.804.804 0 01-.794.68H7.72a.483.483 0 01-.477-.558L7.418 21l1.177-7.46.022-.14a.805.805 0 01.794-.68h1.659c3.238 0 5.774-1.314 6.514-5.12a3.936 3.936 0 00-.517.878z" />
                <path d="M9.928 8.478a.805.805 0 01.794-.68h4.908c.58 0 1.11.044 1.592.145.16.034.318.072.475.114.48.128.928.31 1.334.553.1-1.358-.085-2.28-.647-3.199C17.538 3.924 15.822 3.34 13.647 3.34H6.869a.805.805 0 00-.794.68L3.5 17.812a.483.483 0 00.477.558h3.332l.836-5.304.776-4.588z" />
              </svg>
              <span className="font-medium">PayPal</span>
            </button>
          </div>
        </div>

        {/* Payment Form */}
        <div className="mb-6">
          {paymentMethod === "card" ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Card Details</h3>
              </div>
              <div
                id="card-container"
                className="border border-gray-300 rounded-lg p-4 min-h-[120px]"
              ></div>
            </>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4">
              <PayPalPayment
                amount={selectedPackage.price * 100}
                orderId={`CREDIT_${userId}`}
                description={`${selectedPackage.credits} Ticket Credits`}
                onSuccess={async (paypalOrderId) => {
                  setIsProcessing(true);
                  try {
                    const response = await fetch("/api/credits/purchase-with-paypal", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId,
                        credits: selectedPackage.credits,
                        orderID: paypalOrderId,
                      }),
                    });

                    const data = await response.json();
                    if (response.ok && data.success) {
                      onSuccess();
                      onClose();
                    } else {
                      setError(data.error || "Payment failed");
                    }
                  } catch (err: any) {
                    setError(err.message || "Payment processing failed");
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                onError={(error) => setError(error)}
              />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Total */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Credits:</span>
            <span className="font-semibold">{selectedPackage.credits} tickets</span>
          </div>
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="text-primary">${selectedPackage.price}</span>
          </div>
        </div>

        {/* Actions */}
        {paymentMethod === "card" && (
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Purchase ${selectedPackage.price}</>
              )}
            </button>
          </div>
        )}
        {paymentMethod === "paypal" && (
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
