"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  User,
  Mail,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const updatePaymentSettings = useMutation(api.users.mutations.updatePaymentProcessorSettings);
  const connectStripe = useMutation(api.users.mutations.connectStripeAccount);
  const connectPaypal = useMutation(api.users.mutations.connectPaypalAccount);
  const disconnectProcessor = useMutation(api.users.mutations.disconnectPaymentProcessor);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data from API instead of Convex
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const handleConnectStripe = async () => {
    try {
      setIsProcessing(true);
      // In production, this would redirect to Stripe Connect OAuth flow
      // For now, show alert that feature is coming soon
      alert(
        "Stripe Connect integration coming soon! You'll be redirected to complete Stripe setup."
      );
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      alert("Failed to connect Stripe account");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectPaypal = async () => {
    try {
      setIsProcessing(true);
      // In production, this would redirect to PayPal OAuth flow
      alert("PayPal integration coming soon! You'll be redirected to complete PayPal setup.");
    } catch (error) {
      console.error("Error connecting PayPal:", error);
      alert("Failed to connect PayPal account");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnectProcessor = async (processor: "stripe" | "paypal") => {
    if (
      !confirm(
        `Are you sure you want to disconnect ${processor === "stripe" ? "Stripe" : "PayPal"}?`
      )
    ) {
      return;
    }

    try {
      setIsProcessing(true);
      await disconnectProcessor({ processor });
      alert(`${processor === "stripe" ? "Stripe" : "PayPal"} disconnected successfully`);
    } catch (error) {
      console.error(`Error disconnecting ${processor}:`, error);
      alert(`Failed to disconnect ${processor}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePaymentMethod = async (
    method: "stripe" | "paypal" | "cash",
    enabled: boolean
  ) => {
    try {
      setIsProcessing(true);
      const updates: any = {};

      if (method === "stripe") updates.acceptsStripePayments = enabled;
      if (method === "paypal") updates.acceptsPaypalPayments = enabled;
      if (method === "cash") updates.acceptsCashPayments = enabled;

      await updatePaymentSettings(updates);
    } catch (error) {
      console.error("Error updating payment method:", error);
      alert("Failed to update payment method");
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if still loading
  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={currentUser.name || ""}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={currentUser.email}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent text-accent-foreground">
                  {currentUser.role === "organizer"
                    ? "Event Organizer"
                    : currentUser.role || "User"}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Account settings are managed through your authentication provider.
            </p>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Settings
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure how you receive ticket payments from customers
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Stripe Payment Processor */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    Stripe
                    {currentUser.stripeConnectedAccountId && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Accept credit card payments through Stripe
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentUser.acceptsStripePayments || false}
                    onChange={(e) => handleTogglePaymentMethod("stripe", e.target.checked)}
                    disabled={!currentUser.stripeConnectedAccountId || isProcessing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
                </label>
              </div>
              {currentUser.stripeConnectedAccountId ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-3 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    Connected
                  </div>
                  <button
                    onClick={() => handleDisconnectProcessor("stripe")}
                    disabled={isProcessing}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 transition-colors disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectStripe}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
                >
                  Connect Stripe Account
                </button>
              )}
            </div>

            {/* PayPal Payment Processor */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    PayPal
                    {currentUser.paypalMerchantId && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Accept PayPal payments from customers
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentUser.acceptsPaypalPayments || false}
                    onChange={(e) => handleTogglePaymentMethod("paypal", e.target.checked)}
                    disabled={!currentUser.paypalMerchantId || isProcessing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
                </label>
              </div>
              {currentUser.paypalMerchantId ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-3 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    Connected
                  </div>
                  <button
                    onClick={() => handleDisconnectProcessor("paypal")}
                    disabled={isProcessing}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 transition-colors disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectPaypal}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
                >
                  Connect PayPal Account
                </button>
              )}
            </div>

            {/* Cash Payments */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Cash Payments</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Accept cash payments in person (no online processing)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentUser.acceptsCashPayments || false}
                    onChange={(e) => handleTogglePaymentMethod("cash", e.target.checked)}
                    disabled={isProcessing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Credit Balance</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your pre-purchased ticket credits for the PREPAY payment model
              </p>
              <div className="flex items-center gap-4">
                <div className="px-4 py-3 bg-accent border border-border rounded-lg">
                  <p className="text-sm text-primary">Available Credits</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <Link href="/pricing" className="text-sm text-primary hover:underline">
                  Purchase Credits
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive updates about your events and sales</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Marketing Emails</p>
                <p className="text-sm text-gray-600">Get tips and news about SteppersLife</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingEmails}
                  onChange={(e) => setMarketingEmails(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <p className="text-sm text-gray-500">
              Note: Notification settings will be saved when we implement the backend.
            </p>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <Link
              href="/privacy"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">Privacy Policy</span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/terms"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">Terms of Service</span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Help & Support */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Help & Support
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <Link
              href="/help"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">Help Center</span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </Link>
            <a
              href="mailto:support@stepperslife.com"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900">Contact Support</p>
                <p className="text-sm text-gray-600">support@stepperslife.com</p>
              </div>
              <Mail className="w-4 h-4 text-gray-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
