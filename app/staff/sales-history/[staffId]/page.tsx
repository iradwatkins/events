"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DollarSign, Ticket, Calendar, CreditCard, Wallet, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function SalesHistoryPage() {
  const params = useParams();
  const staffId = params.staffId as Id<"eventStaff">;

  const staffDetails = useQuery(api.staff.queries.getStaffMemberDetails, { staffId });
  const staffSales = useQuery(api.staff.queries.getStaffSales, { staffId, limit: 100 });

  if (!staffDetails || !staffSales) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <Link
        href="/staff/dashboard"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
        <p className="text-gray-600 mt-1">{staffDetails.name}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Sales</span>
            <Ticket className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{staffDetails.ticketsSold}</p>
          <p className="text-xs text-gray-500 mt-1">Tickets sold</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Commission Earned</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${(staffDetails.commissionEarned / 100).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total earned</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Cash Collected</span>
            <Wallet className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${((staffDetails.cashCollected || 0) / 100).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">In hand</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Net Payout</span>
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${(staffDetails.netPayout / 100).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Commission - Cash</p>
        </div>
      </div>

      {/* Sales Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Sales by Payment Method</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-accent rounded-lg">
            <CreditCard className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{staffDetails.salesBreakdown.online}</p>
            <p className="text-sm text-gray-600">Online</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Wallet className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{staffDetails.salesBreakdown.cash}</p>
            <p className="text-sm text-gray-600">Cash</p>
          </div>
          <div className="text-center p-4 bg-accent rounded-lg">
            <DollarSign className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {staffDetails.salesBreakdown.cashApp}
            </p>
            <p className="text-sm text-gray-600">Cash App</p>
          </div>
        </div>
      </div>

      {/* Sales History Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
        </div>

        {staffSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {staffSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(sale.createdAt), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {sale.orderId.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.ticketCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          sale.paymentMethod === "CASH"
                            ? "bg-green-100 text-green-800"
                            : sale.paymentMethod === "CASH_APP"
                              ? "bg-accent text-gray-800"
                              : "bg-accent text-accent-foreground"
                        }`}
                      >
                        {sale.paymentMethod || "ONLINE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${(sale.commissionAmount / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Sales Yet</h3>
            <p className="text-gray-600">
              Your sales history will appear here once you start selling tickets
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
