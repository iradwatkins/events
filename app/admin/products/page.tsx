"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Filter,
  DollarSign,
  CheckCircle2,
  FileText,
  Archive,
  Eye,
  Copy,
} from "lucide-react";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export default function ProductsManagementPage() {
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");

  const allProducts = useQuery(
    api.products.queries.getAllProducts,
    statusFilter !== "all" ? { status: statusFilter } : {}
  );

  const deleteProduct = useMutation(api.products.mutations.deleteProduct);
  const duplicateProduct = useMutation(api.products.mutations.duplicateProduct);

  const handleDeleteProduct = async (productId: Id<"products">, productName: string) => {
    try {
      await deleteProduct({ productId });
    } catch (error: unknown) {
      alert(`Failed to delete product: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDuplicateProduct = async (productId: Id<"products">, productName: string) => {
    try {
      const newProductId = await duplicateProduct({ productId });
      window.location.href = `/admin/products/${newProductId}/edit`;
    } catch (error: unknown) {
      alert(
        `Failed to duplicate product: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  if (!allProducts) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const stats = {
    total: allProducts.length,
    active: allProducts.filter((p) => p.status === "ACTIVE").length,
    draft: allProducts.filter((p) => p.status === "DRAFT").length,
    archived: allProducts.filter((p) => p.status === "ARCHIVED").length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your store products and inventory</p>
        </div>
        <Link
          href="/admin/products/create"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent text-primary rounded-full flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Archived</p>
              <p className="text-2xl font-bold text-gray-900">{stats.archived}</p>
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
            <option value="all">All Products</option>
            <option value="ACTIVE">Active Only</option>
            <option value="DRAFT">Draft Only</option>
            <option value="ARCHIVED">Archived Only</option>
          </select>

          <span className="text-sm text-gray-600">
            Showing {allProducts.length} {allProducts.length === 1 ? "product" : "products"}
          </span>
        </div>
      </div>

      {/* Products Grid */}
      {allProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No products found</p>
          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 relative">
                {product.primaryImage ? (
                  <img
                    src={product.primaryImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : product.status === "DRAFT"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-lg font-bold text-gray-900">
                    ${(product.price / 100).toFixed(2)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      ${(product.compareAtPrice / 100).toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  <span>Stock: {product.inventoryQuantity}</span>
                  {product.sku && <span> • SKU: {product.sku}</span>}
                </div>

                {product.category && (
                  <span className="inline-block px-2 py-1 bg-accent text-primary text-xs rounded">
                    {product.category}
                  </span>
                )}

                {/* Actions */}
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/shop/${product._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
                    <Link
                      href={`/admin/products/${product._id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-accent text-primary rounded-lg hover:bg-primary/20 transition-colors text-xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDuplicateProduct(product._id, product.name)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-accent text-primary rounded-lg hover:bg-primary/20 transition-colors text-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id, product.name)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
