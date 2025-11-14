"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Package,
  Filter,
  DollarSign,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

type FulfillmentStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export default function OrdersManagementPage() {
  const [statusFilter, setStatusFilter] = useState<FulfillmentStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<Id<"productOrders"> | null>(null);
  const [trackingInfo, setTrackingInfo] = useState({ number: "", url: "" });

  const allOrders = useQuery(
    api.products.orders.getAllOrders,
    statusFilter !== "all" ? { fulfillmentStatus: statusFilter } : {}
  );

  const updateFulfillmentStatus = useMutation(api.products.orders.updateFulfillmentStatus);

  const handleStatusChange = async (orderId: Id<"productOrders">, newStatus: FulfillmentStatus) => {
    try {
      await updateFulfillmentStatus({
        orderId,
        fulfillmentStatus: newStatus,
      });
    } catch (error: unknown) {
      alert(`Failed to update status: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleAddTracking = async () => {
    if (!selectedOrder) return;

    try {
      await updateFulfillmentStatus({
        orderId: selectedOrder,
        fulfillmentStatus: "SHIPPED",
        trackingNumber: trackingInfo.number || undefined,
        trackingUrl: trackingInfo.url || undefined,
      });
      setSelectedOrder(null);
      setTrackingInfo({ number: "", url: "" });
    } catch (error: unknown) {
      alert(`Failed to add tracking: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (!allOrders) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const stats = {
    total: allOrders.length,
    pending: allOrders.filter((o) => o.fulfillmentStatus === "PENDING").length,
    processing: allOrders.filter((o) => o.fulfillmentStatus === "PROCESSING").length,
    shipped: allOrders.filter((o) => o.fulfillmentStatus === "SHIPPED").length,
    delivered: allOrders.filter((o) => o.fulfillmentStatus === "DELIVERED").length,
  };

  const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">Manage customer orders and fulfillment</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent text-primary rounded-full flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent text-primary rounded-full flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent text-primary rounded-full flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Shipped</p>
              <p className="text-2xl font-bold text-gray-900">{stats.shipped}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(totalRevenue / 100).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="all">All Orders</option>
            <option value="PENDING">Pending Only</option>
            <option value="PROCESSING">Processing Only</option>
            <option value="SHIPPED">Shipped Only</option>
            <option value="DELIVERED">Delivered Only</option>
            <option value="CANCELLED">Cancelled Only</option>
          </select>

          <span className="text-sm text-gray-600">
            Showing {allOrders.length} {allOrders.length === 1 ? "order" : "orders"}
          </span>
        </div>
      </div>

      {/* Orders Table */}
      {allOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fulfillment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-gray-500">{order.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${(order.totalAmount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === "PAID"
                            ? "bg-green-100 text-green-800"
                            : order.paymentStatus === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.paymentStatus === "PAID" && <CheckCircle2 className="w-3 h-3" />}
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          order.fulfillmentStatus === "DELIVERED"
                            ? "bg-green-100 text-green-800"
                            : order.fulfillmentStatus === "SHIPPED"
                              ? "bg-accent text-accent-foreground"
                              : order.fulfillmentStatus === "PROCESSING"
                                ? "bg-accent text-accent-foreground"
                                : order.fulfillmentStatus === "CANCELLED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.fulfillmentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {order.fulfillmentStatus === "PENDING" && (
                          <button
                            onClick={() => handleStatusChange(order._id, "PROCESSING")}
                            className="px-2 py-1 bg-accent text-primary rounded hover:bg-accent/90 text-xs"
                          >
                            Process
                          </button>
                        )}
                        {order.fulfillmentStatus === "PROCESSING" && (
                          <button
                            onClick={() => setSelectedOrder(order._id)}
                            className="px-2 py-1 bg-accent text-primary rounded hover:bg-primary/20 text-xs"
                          >
                            Ship
                          </button>
                        )}
                        {order.trackingUrl && (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-primary hover:bg-accent rounded"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-gray-900">Add Tracking Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingInfo.number}
                  onChange={(e) => setTrackingInfo({ ...trackingInfo, number: e.target.value })}
                  placeholder="1Z999AA10123456784"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tracking URL</label>
                <input
                  type="url"
                  value={trackingInfo.url}
                  onChange={(e) => setTrackingInfo({ ...trackingInfo, url: e.target.value })}
                  placeholder="https://www.ups.com/track?..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddTracking}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Mark as Shipped
              </button>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setTrackingInfo({ number: "", url: "" });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
