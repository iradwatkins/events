"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/contexts/CartContext";
import { ArrowLeft, CheckCircle2, Loader2, Package, MapPin, Truck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import toast from "react-hot-toast";

declare global {
  interface Window {
    Square?: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [squareLoaded, setSquareLoaded] = useState(false);
  const [card, setCard] = useState<any>(null);

  const [shippingMethod, setShippingMethod] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [shippingCost, setShippingCost] = useState(0);

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    // Pickup location
    pickupLocation: "chicago-downtown",
    // Delivery address
    address1: "",
    address2: "",
    city: "Chicago",
    state: "IL",
    zipCode: "",
    country: "USA",
  });

  const createProductOrder = useMutation(api.productOrders.mutations.createProductOrder);

  // Calculate shipping cost when method changes or items change
  useEffect(() => {
    if (shippingMethod === "DELIVERY" && items.length > 0) {
      // Note: We'll fetch shipping prices from products when available
      // For now, show placeholder
      setShippingCost(1000); // $10.00 placeholder
    } else {
      setShippingCost(0);
    }
  }, [shippingMethod, items]);

  // Square Web Payments SDK
  useEffect(() => {
    if (squareLoaded && window.Square) {
      initializeSquare();
    }
  }, [squareLoaded]);

  const initializeSquare = async () => {
    if (!window.Square) {
      console.error("Square.js failed to load");
      return;
    }

    try {
      const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
      const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;


      if (!appId || !locationId) {
        console.error("Missing Square credentials");
        return;
      }

      const payments = window.Square.payments(appId, locationId);

      const cardInstance = await payments.card();
      await cardInstance.attach("#card-container");
      setCard(cardInstance);
    } catch (e) {
      console.error("Failed to initialize Square payment form:", e);
      // Show user-friendly error
      toast.error("Payment form initialization failed. Please contact support.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate form
    const requiredFields = ["email", "firstName", "lastName", "phone"];
    if (shippingMethod === "DELIVERY") {
      requiredFields.push("address1", "city", "state", "zipCode");
    }

    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(", ")}`);
      return;
    }

    setIsProcessing(true);

    try {
      let paymentToken = null;

      // Get payment token from Square
      if (card) {
        const result = await card.tokenize();
        if (result.status === "OK") {
          paymentToken = result.token;
        } else {
          throw new Error(result.errors?.[0]?.message || "Payment tokenization failed");
        }
      }

      // Create order
      const result = await createProductOrder({
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          variantId: item.variantId,
          variantName: item.variantName,
          quantity: item.quantity,
          price: item.productPrice,
        })),
        customerEmail: formData.email,
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerPhone: formData.phone,
        shippingMethod,
        shippingAddress: {
          name: `${formData.firstName} ${formData.lastName}`,
          address1: shippingMethod === "DELIVERY" ? formData.address1 : formData.pickupLocation,
          address2: formData.address2,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone,
        },
        pickupLocation: shippingMethod === "PICKUP" ? formData.pickupLocation : undefined,
      });

      setOrderNumber(result.orderNumber);

      // Clear cart
      clearCart();

      // Show success
      setOrderComplete(true);
    } catch (error) {
      console.error("Order creation error:", error);
      toast.error(
        `Failed to create order: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !orderComplete) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add some products to your cart before checking out.
            </p>
            <Link
              href="/shop"
              className="block w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  if (orderComplete) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for your order. We'll send you an email confirmation shortly
              {shippingMethod === "PICKUP" ? " with pickup details" : ""}.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Order Number</p>
              <p className="text-lg font-bold text-primary font-mono">{orderNumber}</p>
            </div>
            {shippingMethod === "PICKUP" ? (
              <div className="bg-accent/50 border border-border rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground mb-1">Pickup Location</h3>
                    <p className="text-sm text-primary">
                      {formData.pickupLocation
                        .split("-")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}{" "}
                      - Details will be sent via email
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <h3 className="font-semibold text-green-900 mb-1">Delivery Address</h3>
                    <p className="text-sm text-green-700">
                      {formData.address1}, {formData.city}, {formData.state} {formData.zipCode}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <Link
                href="/shop"
                className="block w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continue Shopping
              </Link>
              <Link
                href="/"
                className="block w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      {/* Load Square Web Payments SDK */}
      <Script
        src={
          process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === "production"
            ? "https://web.squarecdn.com/v1/square.js"
            : "https://sandbox.web.squarecdn.com/v1/square.js"
        }
        strategy="lazyOnload"
        onLoad={() => setSquareLoaded(true)}
      />

      <PublicHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Back Link */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Shop
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
                {/* Contact Information */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Shipping Method */}
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Method</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setShippingMethod("PICKUP")}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        shippingMethod === "PICKUP"
                          ? "border-primary bg-primary/10"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <MapPin
                        className={`w-8 h-8 mx-auto mb-2 ${shippingMethod === "PICKUP" ? "text-primary" : "text-gray-400"}`}
                      />
                      <p className="font-semibold">Pickup</p>
                      <p className="text-sm text-gray-600">Free</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingMethod("DELIVERY")}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        shippingMethod === "DELIVERY"
                          ? "border-primary bg-primary/10"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Truck
                        className={`w-8 h-8 mx-auto mb-2 ${shippingMethod === "DELIVERY" ? "text-primary" : "text-gray-400"}`}
                      />
                      <p className="font-semibold">Delivery</p>
                      <p className="text-sm text-gray-600">Calculated by admin</p>
                    </button>
                  </div>
                </div>

                {/* Pickup Location or Delivery Address */}
                {shippingMethod === "PICKUP" ? (
                  <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Pickup Location
                    </h2>
                    <div className="bg-accent/50 border border-border rounded-lg p-4 mb-4">
                      <p className="text-sm text-primary">
                        All orders are available for pickup in Chicago. Select your preferred pickup
                        location below.
                      </p>
                    </div>
                    <select
                      name="pickupLocation"
                      value={formData.pickupLocation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="chicago-downtown">Chicago Downtown</option>
                      <option value="chicago-north">Chicago North Side</option>
                      <option value="chicago-south">Chicago South Side</option>
                      <option value="chicago-west">Chicago West Side</option>
                    </select>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-primary" />
                      Delivery Address
                    </h2>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-amber-700">
                        Shipping cost will be calculated based on the products in your cart and
                        confirmed after order placement.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          name="address1"
                          value={formData.address1}
                          onChange={handleInputChange}
                          required={shippingMethod === "DELIVERY"}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Apartment, Suite, etc. (Optional)
                        </label>
                        <input
                          type="text"
                          name="address2"
                          value={formData.address2}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required={shippingMethod === "DELIVERY"}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            required={shippingMethod === "DELIVERY"}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code *
                          </label>
                          <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            required={shippingMethod === "DELIVERY"}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
                  <div id="card-container" className="min-h-[100px]"></div>
                  {!squareLoaded && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-gray-600">Loading payment form...</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing || !squareLoaded}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Place Order - ${((getSubtotal() + shippingCost) / 100).toFixed(2)}</>
                  )}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantId || "default"}`}
                      className="flex gap-3 pb-4 border-b border-gray-200"
                    >
                      {item.productImage ? (
                        <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                          {item.productName}
                        </h3>
                        {item.variantName && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.variantName}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          Qty: {item.quantity} × ${(item.productPrice / 100).toFixed(2)}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          ${((item.productPrice * item.quantity) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${(getSubtotal() / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span
                      className={shippingMethod === "PICKUP" ? "text-green-600 font-semibold" : ""}
                    >
                      {shippingMethod === "PICKUP" ? "FREE" : "TBD"}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-primary">
                      ${((getSubtotal() + shippingCost) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <PublicFooter />
    </>
  );
}
