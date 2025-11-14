"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function SettlementDashboard() {
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | undefined>();
  const [expandedStaffId, setExpandedStaffId] = useState<Id<"eventStaff"> | null>(null);

  const settlement = useQuery(
    api.staff.settlement.getOrganizerSettlement,
    selectedEventId ? { eventId: selectedEventId } : {}
  );

  const organizerEvents = useQuery(api.events.queries.getOrganizerEvents);

  const markPaid = useMutation(api.staff.settlement.markSettlementPaid);
  const markPending = useMutation(api.staff.settlement.markSettlementPending);

  if (!settlement || !organizerEvents) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const handleMarkPaid = async (staffId: Id<"eventStaff">) => {
    try {
      await markPaid({ staffId });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleMarkPending = async (staffId: Id<"eventStaff">) => {
    try {
      await markPending({ staffId });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const exportToCSV = () => {
    const csv = [
      [
        "Staff Name",
        "Event",
        "Tickets Sold",
        "Commission Earned",
        "Cash Collected",
        "Net Settlement",
        "Status",
      ],
      ...settlement.settlements.map((s) => [
        s.staffName,
        s.eventName,
        s.totalTickets,
        `$${(s.commissionEarned / 100).toFixed(2)}`,
        `$${(s.cashCollected / 100).toFixed(2)}`,
        `$${(Math.abs(s.netSettlement) / 100).toFixed(2)} ${s.netSettlement > 0 ? "(Owed to staff)" : s.netSettlement < 0 ? "(Owed by staff)" : ""}`,
        s.settlementStatus,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settlement-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Staff Settlement</h1>
        <p className="text-gray-600 mt-1">Manage payments and reconciliation with your staff</p>
      </div>

      {/* Event Filter */}
      <div className="mb-6 flex gap-4 items-center">
        <label className="text-sm font-medium text-gray-700">Filter by Event:</label>
        <select
          value={selectedEventId || "all"}
          onChange={(e) =>
            setSelectedEventId(
              e.target.value === "all" ? undefined : (e.target.value as Id<"events">)
            )
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Events</option>
          {organizerEvents.map((event) => (
            <option key={event._id} value={event._id}>
              {event.name}
            </option>
          ))}
        </select>

        <button
          onClick={exportToCSV}
          className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Active Staff</p>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {settlement.summary.activeStaff}
            <span className="text-sm text-gray-500 font-normal ml-2">
              / {settlement.summary.totalStaff}
            </span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Commission</p>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${(settlement.summary.totalCommissionEarned / 100).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Owed to Staff</p>
            <TrendingUp className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">
            ${(settlement.summary.totalOwedToStaff / 100).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Owed by Staff</p>
            <TrendingDown className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            ${(settlement.summary.totalOwedByStaff / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Settlement List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {settlement.settlements.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No staff members found for the selected event</p>
            </div>
          ) : (
            settlement.settlements.map((staff) => (
              <div key={staff.staffId} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                {/* Staff Row */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">{staff.staffName}</h3>
                      {!staff.isActive && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                      {staff.hierarchyLevel && staff.hierarchyLevel > 1 && (
                        <span className="px-2 py-1 bg-accent text-primary text-xs rounded-full">
                          Level {staff.hierarchyLevel} Sub-Seller
                        </span>
                      )}
                      {staff.settlementStatus === "PAID" ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Paid
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {staff.eventName} • {staff.staffEmail}
                    </p>

                    {/* Quick Stats */}
                    <div className="flex gap-6 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">Tickets Sold:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {staff.totalTickets}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Commission:</span>
                        <span className="font-semibold text-green-600 ml-2">
                          ${(staff.commissionEarned / 100).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Cash Collected:</span>
                        <span className="font-semibold text-primary ml-2">
                          ${(staff.cashCollected / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Net Settlement */}
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Net Settlement</p>
                    {staff.netSettlement === 0 ? (
                      <p className="text-2xl font-bold text-gray-400">$0.00</p>
                    ) : staff.netSettlement > 0 ? (
                      <div>
                        <p className="text-2xl font-bold text-red-600">
                          ${(staff.netSettlement / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600">You owe staff</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          ${(Math.abs(staff.netSettlement) / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600">Staff owes you</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
                      {staff.settlementStatus === "PENDING" ? (
                        <button
                          onClick={() => handleMarkPaid(staff.staffId)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkPending(staff.staffId)}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                        >
                          Mark Unpaid
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setExpandedStaffId(
                            expandedStaffId === staff.staffId ? null : staff.staffId
                          )
                        }
                        className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        Details
                        {expandedStaffId === staff.staffId ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedStaffId === staff.staffId && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Commission Type</p>
                        <p className="font-semibold text-gray-900">
                          {staff.commissionType === "PERCENTAGE"
                            ? `${staff.commissionValue}%`
                            : `$${(staff.commissionValue || 0) / 100}/ticket`}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Cash Sales</p>
                        <p className="font-semibold text-gray-900">{staff.cashSalesCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Credit Sales</p>
                        <p className="font-semibold text-gray-900">{staff.creditSalesCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Referral Code</p>
                        <p className="font-mono font-semibold text-gray-900 text-xs">
                          {staff.staffId}
                        </p>
                      </div>
                    </div>

                    {staff.settlementPaidAt && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          <CheckCircle2 className="w-4 h-4 inline mr-1" />
                          Marked as paid on {new Date(staff.settlementPaidAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-accent border border-border rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">How Settlement Works</h3>
            <ul className="text-sm text-accent-foreground space-y-1">
              <li>
                • <strong>Commission Earned:</strong> Total commission from all ticket sales (cash +
                credit)
              </li>
              <li>
                • <strong>Cash Collected:</strong> Total cash received by staff for cash sales
              </li>
              <li>
                • <strong>Net Settlement = Commission - Cash Collected</strong>
              </li>
              <li>• If positive (red): You owe the staff member money</li>
              <li>• If negative (green): The staff member owes you money</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
