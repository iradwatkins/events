"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DollarSign,
  Ticket,
  Share2,
  Copy,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Users,
  Percent,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function StaffDashboardPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const staffPositions = useQuery(api.staff.queries.getStaffDashboard);

  if (!staffPositions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const handleCopyReferralLink = (eventId: string, referralCode: string) => {
    const baseUrl = window.location.origin;
    const referralLink = `${baseUrl}/events/${eventId}/checkout?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopiedCode(referralCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyReferralCode = (referralCode: string) => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(referralCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Calculate totals
  const totalTicketsSold = staffPositions.reduce((sum, pos) => sum + pos.ticketsSold, 0);
  const totalCommissionEarned = staffPositions.reduce((sum, pos) => sum + pos.commissionEarned, 0);
  const totalCashCollected = staffPositions.reduce((sum, pos) => sum + pos.cashCollected, 0);
  const totalNetPayout = staffPositions.reduce((sum, pos) => sum + pos.netPayout, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your sales and commissions</p>
          </div>
          <Link
            href="/staff/my-team"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <Users className="w-5 h-5" />
            My Default Team
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Tickets Sold</p>
            <p className="text-3xl font-bold text-gray-900">{totalTicketsSold}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Commission Earned</p>
            <p className="text-3xl font-bold text-gray-900">
              ${(totalCommissionEarned / 100).toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Cash Collected</p>
            <p className="text-3xl font-bold text-gray-900">
              ${(totalCashCollected / 100).toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Net Payout</p>
            <p className="text-3xl font-bold text-gray-900">
              ${(totalNetPayout / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Events List */}
        {staffPositions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Positions</h3>
            <p className="text-gray-600">
              You don't have any active staff positions yet. Contact an event organizer to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {staffPositions.map((position) => {
              if (!position.event) return null;

              return (
                <div
                  key={position._id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                >
                  {/* Event Header */}
                  <div className="p-6 border-b bg-purple-600">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {position.event.name}
                        </h3>
                        {position.event.startDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(position.event.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                            {position.role}
                          </span>
                          {position.hierarchyLevel && position.hierarchyLevel > 1 && (
                            <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                              Level {position.hierarchyLevel} Sub-Seller
                            </span>
                          )}
                          {position.canAssignSubSellers && (
                            <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                              Can Assign Sellers
                            </span>
                          )}
                        </div>
                      </div>
                      {position.event.imageUrl && (
                        <img
                          src={position.event.imageUrl}
                          alt={position.event.name}
                          className="w-24 h-24 rounded-lg object-cover ml-4"
                        />
                      )}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b bg-gray-50">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Tickets Sold</p>
                      <p className="text-2xl font-bold text-gray-900">{position.ticketsSold}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Remaining</p>
                      <p className="text-2xl font-bold text-gray-900">{position.ticketsRemaining}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Commission</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${(position.commissionEarned / 100).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Cash Collected</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${(position.cashCollected / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Commission Structure */}
                  {position.role === "SELLER" && (
                    <div className="px-6 py-4 border-b bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {position.commissionType === "PERCENTAGE" ? (
                            <>
                              <Percent className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-900">
                                {position.commissionValue}% commission per ticket
                              </span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-900">
                                ${((position.commissionValue || 0) / 100).toFixed(2)} per ticket
                              </span>
                            </>
                          )}
                        </div>
                        <Link
                          href={`/staff/sales-history/${position._id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                        >
                          View Sales History →
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Hierarchy & Quick Actions */}
                  {position.canAssignSubSellers && (
                    <div className="px-6 py-4 bg-green-50 border-b">
                      <Link
                        href="/staff/my-sub-sellers"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800 hover:underline"
                      >
                        <Users className="w-4 h-4" />
                        Manage My Sub-Sellers →
                      </Link>
                    </div>
                  )}

                  {/* Referral Code Section */}
                  {position.referralCode && (
                    <div className="p-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Your Referral Code
                      </h4>
                      <div className="space-y-3">
                        {/* Referral Code */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-mono text-lg font-bold text-gray-900">
                            {position.referralCode}
                          </div>
                          <button
                            onClick={() => handleCopyReferralCode(position.referralCode)}
                            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            {copiedCode === position.referralCode ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>

                        {/* Referral Link */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 px-4 py-3 bg-gray-100 rounded-lg text-sm text-gray-700 truncate">
                            {`${window.location.origin}/events/${position.event._id}/checkout?ref=${position.referralCode}`}
                          </div>
                          <button
                            onClick={() => handleCopyReferralLink(position.event!._id, position.referralCode)}
                            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            {copiedCode === position.referralCode ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Share2 className="w-4 h-4" />
                                Share
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
