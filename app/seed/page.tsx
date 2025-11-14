"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

export default function SeedPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSeed = async () => {
    setStatus("loading");
    try {
      // We'll need to create the mutation, but for now show instructions
      setStatus("success");
      setMessage(
        "To seed sample events, run this command in your terminal:\n\nnpx convex run seed:createSampleEvents"
      );
    } catch (err) {
      setStatus("error");
      setMessage("Failed to seed data");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Seed Sample Events</h1>

        <p className="text-gray-600 mb-6">
          This will create 6 sample stepping events with Unsplash images to test the platform.
        </p>

        <div className="bg-accent border border-border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-2">Sample Events Include:</h3>
          <ul className="text-sm text-accent-foreground space-y-1">
            <li>• Chicago Steppers Set - Summer Edition (Ticketed)</li>
            <li>• Steppin' Workshop: Mastering the Basics (Ticketed)</li>
            <li>• Memorial Day Weekend Steppers Cruise 2025 (Save the Date)</li>
            <li>• Outdoor Steppin' in the Park (Free Event)</li>
            <li>• New Year's Eve Steppers Ball 2025 (Ticketed)</li>
            <li>• Detroit Steppers Weekend Getaway (Ticketed)</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-2">Run this command in your terminal:</h3>
          <code className="block bg-yellow-100 p-3 rounded text-sm font-mono text-yellow-900 overflow-x-auto">
            npx convex run seed:createSampleEvents
          </code>
        </div>

        {status === "success" && (
          <div className="flex items-center gap-2 text-green-600 mb-4">
            <CheckCircle className="w-5 h-5" />
            <span>{message}</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle className="w-5 h-5" />
            <span>{message}</span>
          </div>
        )}

        <div className="text-sm text-gray-500 mt-6">
          <p className="font-semibold mb-2">After running the command:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to homepage (/) to see the events in masonry grid</li>
            <li>Click any event to see the detail page</li>
            <li>Try the search and category filters</li>
            <li>Test the Buy Tickets button on ticketed events</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
