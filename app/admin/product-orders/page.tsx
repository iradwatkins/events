"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Package, Truck, CheckCircle, XCircle, Edit, Search } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminProductOrdersPage() {
  const orders = useQuery(api.productOrders.queries.getAllOrders);
  const updateFulfillment = useMutation(api.productOrders.mutations.updateFulfillmentStatus);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [fulfillmentData, setFulfillmentData] = useState({
    status: "PENDING" as "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
    trackingNumber: "",
    trackingUrl: "",
    internalNote: "",
  });

  const handleUpdateFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsProcessing(true);
    try {
      await updateFulfillment({
        orderId: selectedOrder._id,
        fulfillmentStatus: fulfillmentData.status,
        trackingNumber: fulfillmentData.trackingNumber || undefined,
        trackingUrl: fulfillmentData.trackingUrl || undefined,
        internalNote: fulfillmentData.internalNote || undefined,
      });

      setSelectedOrder(null);
      setFulfillmentData({
        status: "PENDING",
        trackingNumber: "",
        trackingUrl: "",
        internalNote: "",
      });
    } catch (error) {
      console.error("Failed to update order:", error);
      alert("Failed to update order");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || order.fulfillmentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESSING":
        return "bg-accent text-foreground";
      case "SHIPPED":
        return "bg-accent text-foreground";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (orders === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Orders</h1>
        <p className="text-gray-600">Manage and process product orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders?.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredOrders?.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Order #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()} at{" "}
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.fulfillmentStatus)}`}
                  >
                    {order.fulfillmentStatus}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setFulfillmentData({
                        status: order.fulfillmentStatus,
                        trackingNumber: order.trackingNumber || "",
                        trackingUrl: order.trackingUrl || "",
                        internalNote: order.internalNote || "",
                      });
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Customer</p>
                  <p className="font-semibold text-gray-900">{order.customerName}</p>
                  <p className="text-sm text-gray-600">{order.customerEmail}</p>
                  {order.customerPhone && (
                    <p className="text-sm text-gray-600">{order.customerPhone}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Shipping Address</p>
                  <p className="text-sm text-gray-900">{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && (
                    <p className="text-sm text-gray-900">{order.shippingAddress.address2}</p>
                  )}
                  <p className="text-sm text-gray-900">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.zipCode}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Items</p>
                <div className="space-y-2">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.productName}
                        {item.variantName && (
                          <span className="text-gray-500"> - {item.variantName}</span>
                        )}{" "}
                        × {item.quantity}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${(item.totalPrice / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">${(order.subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="text-gray-900">
                    {order.shippingCost === 0
                      ? "FREE"
                      : `$${(order.shippingCost / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-primary">${(order.totalAmount / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Tracking Info */}
              {order.trackingNumber && (
                <div className="border-t border-gray-200 mt-4 pt-4 bg-accent rounded-lg p-3">
                  <p className="text-sm font-semibold text-foreground mb-1">Tracking Number</p>
                  <p className="font-mono text-primary">{order.trackingNumber}</p>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-1 inline-block"
                    >
                      Track Package →
                    </a>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Update Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Update Order #{selectedOrder.orderNumber}
              </h2>

              <form onSubmit={handleUpdateFulfillment} className="space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fulfillment Status *
                  </label>
                  <select
                    value={fulfillmentData.status}
                    onChange={(e) =>
                      setFulfillmentData({ ...fulfillmentData, status: e.target.value as any })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Tracking Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={fulfillmentData.trackingNumber}
                    onChange={(e) =>
                      setFulfillmentData({ ...fulfillmentData, trackingNumber: e.target.value })
                    }
                    placeholder="e.g., 1Z999AA10123456784"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Tracking URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking URL
                  </label>
                  <input
                    type="url"
                    value={fulfillmentData.trackingUrl}
                    onChange={(e) =>
                      setFulfillmentData({ ...fulfillmentData, trackingUrl: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Internal Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Note
                  </label>
                  <textarea
                    value={fulfillmentData.internalNote}
                    onChange={(e) =>
                      setFulfillmentData({ ...fulfillmentData, internalNote: e.target.value })
                    }
                    rows={3}
                    placeholder="Add notes about this order..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? "Updating..." : "Update Order"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
