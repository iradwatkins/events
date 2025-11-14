"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, TrendingUp, ShoppingCart } from "lucide-react";
import Link from "next/link";

export function CreditBalanceCard() {
  const creditBalance = useQuery(api.payments.queries.getCreditBalance);

  if (!creditBalance) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { creditsRemaining, creditsTotal, creditsUsed } = creditBalance;
  const usagePercentage = creditsTotal > 0 ? (creditsUsed / creditsTotal) * 100 : 0;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          Ticket Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Credit Balance Display */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-600">Available Credits</span>
            <span className="text-3xl font-bold text-primary">
              {creditsRemaining.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-gray-500 text-right">
            Worth ${(creditsRemaining * 0.3).toFixed(2)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>{creditsUsed.toLocaleString()} used</span>
            <span>{creditsTotal.toLocaleString()} total</span>
          </div>
        </div>

        {/* Credit Status Messages */}
        {creditsRemaining >= 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-green-800">
                <p className="font-semibold">You're all set!</p>
                <p>You have enough credits to create multiple events.</p>
              </div>
            </div>
          </div>
        )}

        {creditsRemaining < 100 && creditsRemaining > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <ShoppingCart className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-orange-800">
                <p className="font-semibold">Running low on credits</p>
                <p>Consider purchasing more to continue hosting events.</p>
              </div>
            </div>
          </div>
        )}

        {creditsRemaining === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <ShoppingCart className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-800">
                <p className="font-semibold">No credits remaining</p>
                <p>Purchase more credits to create new events.</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-2 pt-2">
          <Link href="/organizer/events/create" className="flex-1">
            <Button className="w-full" variant="default" size="sm">
              Create Event
            </Button>
          </Link>
          {creditsRemaining < 500 && (
            <Link href="/organizer/credits/purchase" className="flex-1">
              <Button className="w-full" variant="outline" size="sm">
                Buy More
              </Button>
            </Link>
          )}
        </div>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center pt-2 border-t">
          Credits are used at $0.30 per ticket sold with the Pre-Purchase model
        </p>
      </CardContent>
    </Card>
  );
}
