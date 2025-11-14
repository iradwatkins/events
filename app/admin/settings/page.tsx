"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Settings as SettingsIcon,
  Bell,
  CreditCard,
  Shield,
  Database,
  Mail,
  Zap,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useState } from "react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "payments" | "notifications" | "security">(
    "general"
  );

  const tabs = [
    { id: "general", name: "General", icon: SettingsIcon },
    { id: "payments", name: "Payments", icon: CreditCard },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "security", name: "Security", icon: Shield },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-600 mt-1">Configure platform-wide settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    isActive
                      ? "border-red-600 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md">
        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "payments" && <PaymentSettings />}
        {activeTab === "notifications" && <NotificationSettings />}
        {activeTab === "security" && <SecuritySettings />}
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">General Settings</h2>
        <p className="text-gray-600 text-sm">Configure basic platform settings and defaults</p>
      </div>

      {/* Platform Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Platform Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
            <input
              type="text"
              defaultValue="Steppers Life Events"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
            <input
              type="email"
              defaultValue="support@stepperslife.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Default Settings */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900">Default Settings</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Default Platform Fee</p>
              <p className="text-sm text-gray-600">Fee charged per ticket sale</p>
            </div>
            <span className="text-lg font-bold text-gray-900">10%</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Default Organizer Credits</p>
              <p className="text-sm text-gray-600">Credits given to new organizers</p>
            </div>
            <span className="text-lg font-bold text-gray-900">100</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Maximum File Upload Size</p>
              <p className="text-sm text-gray-600">For event images and assets</p>
            </div>
            <span className="text-lg font-bold text-gray-900">5 MB</span>
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900">Feature Flags</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Testing Mode</p>
                <p className="text-sm text-gray-600">Bypass Square payment processing</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium">
              ENABLED
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Staff Commission System</p>
                <p className="text-sm text-gray-600">Referral tracking and commissions</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium">
              ENABLED
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Send automated emails to users</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-xs font-medium">
              DISABLED
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Event Analytics</p>
                <p className="text-sm text-gray-600">Advanced analytics for organizers</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-xs font-medium">
              DISABLED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentSettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Settings</h2>
        <p className="text-gray-600 text-sm">Configure payment processing and financial settings</p>
      </div>

      {/* Square Integration */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Square Integration</h3>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Square Connected</p>
              <p className="text-sm text-green-700">Production environment active</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Application ID</p>
              <p className="font-mono text-gray-900">sq0idp-XG8i...H6Q</p>
            </div>
            <div>
              <p className="text-gray-600">Location ID</p>
              <p className="font-mono text-gray-900">L0Q2...BGD8</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Configuration */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900">Payment Configuration</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Minimum Order Amount</p>
              <p className="text-sm text-gray-600">Minimum ticket purchase value</p>
            </div>
            <span className="text-lg font-bold text-gray-900">$1.00</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Maximum Order Amount</p>
              <p className="text-sm text-gray-600">Maximum ticket purchase value</p>
            </div>
            <span className="text-lg font-bold text-gray-900">$10,000</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Payment Methods Accepted</p>
              <p className="text-sm text-gray-600">Supported payment options</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">Card, Cash App</p>
              <p className="text-sm text-gray-600">Google Pay, Apple Pay</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testing Mode Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium mb-1">Testing Mode Active</p>
          <p>
            Payment processing is currently bypassed for testing. No real charges will be made.
            Disable testing mode in production.
          </p>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Settings</h2>
        <p className="text-gray-600 text-sm">Configure email and system notifications</p>
      </div>

      {/* Email Notifications */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Email Notifications</h3>

        <div className="bg-accent border border-border rounded-lg p-4 flex gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-accent-foreground">
            <p className="font-medium mb-1">Email System Not Configured</p>
            <p>
              Email notifications are currently disabled. Configure an email service provider (e.g.,
              SendGrid, Mailgun) to enable automated emails.
            </p>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900">Notification Types</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Order Confirmation</p>
                <p className="text-sm text-gray-600">Send receipt after ticket purchase</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-xs font-medium">
              DISABLED
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Event Reminder</p>
                <p className="text-sm text-gray-600">Remind attendees 24h before event</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-xs font-medium">
              DISABLED
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Welcome Email</p>
                <p className="text-sm text-gray-600">Welcome new users and organizers</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-xs font-medium">
              DISABLED
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Admin Alerts</p>
                <p className="text-sm text-gray-600">System alerts for administrators</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-xs font-medium">
              DISABLED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Security Settings</h2>
        <p className="text-gray-600 text-sm">Configure security and access control settings</p>
      </div>

      {/* Authentication */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Authentication</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Clerk Authentication</p>
                <p className="text-sm text-gray-600">OAuth and email authentication</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium">
              ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">Testing Mode Authentication</p>
                <p className="text-sm text-gray-600">Bypass auth for development</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-yellow-600 text-white rounded-full text-xs font-medium">
              ENABLED
            </span>
          </div>
        </div>
      </div>

      {/* Access Control */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900">Access Control</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Role-Based Access</p>
              <p className="text-sm text-gray-600">Admin, Organizer, User roles</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Admin Dashboard Protection</p>
              <p className="text-sm text-gray-600">Admin-only access control</p>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-600 font-medium">Temporarily Disabled</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">API Rate Limiting</p>
              <p className="text-sm text-gray-600">Prevent abuse and DoS attacks</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>

      {/* Database */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900">Database & Infrastructure</h3>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Convex Backend</p>
              <p className="text-sm text-green-700">Real-time database and serverless functions</p>
            </div>
          </div>
          <div className="text-sm">
            <p className="text-gray-600">Deployment URL</p>
            <p className="font-mono text-gray-900">fearless-dragon-613.convex.cloud</p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
        <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-red-800">
          <p className="font-medium mb-1">Security Notice</p>
          <p>
            Admin dashboard access control is currently disabled for testing. Re-enable
            authentication before deploying to production to prevent unauthorized access.
          </p>
        </div>
      </div>
    </div>
  );
}
