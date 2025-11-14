"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import {
  Package,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Star,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import VariantsManager from "@/components/admin/VariantsManager";
import dynamic from "next/dynamic";

// Dynamic import for heavy ProductOptionsManager (only loaded when needed)
const ProductOptionsManager = dynamic(() => import("@/components/admin/ProductOptionsManager"), {
  loading: () => (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  ),
  ssr: false,
});

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as Id<"products">;

  const product = useQuery(api.products.queries.getProductById, { productId });
  const updateProduct = useMutation(api.products.mutations.updateProduct);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    compareAtPrice: "",
    sku: "",
    inventoryQuantity: "0",
    trackInventory: true,
    allowBackorder: false,
    category: "",
    tags: "",
    requiresShipping: true,
    weight: "",
    shippingPrice: "",
    status: "DRAFT" as "DRAFT" | "ACTIVE" | "ARCHIVED",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsKey, setVariantsKey] = useState(0); // For forcing re-render

  // Load product data when it becomes available
  useEffect(() => {
    if (product) {

      setFormData({
        name: product.name,
        description: product.description,
        price: (product.price / 100).toFixed(2),
        compareAtPrice: product.compareAtPrice ? (product.compareAtPrice / 100).toFixed(2) : "",
        sku: product.sku || "",
        inventoryQuantity: product.inventoryQuantity.toString(),
        trackInventory: product.trackInventory,
        allowBackorder: product.allowBackorder || false,
        category: product.category || "",
        tags: product.tags ? product.tags.join(", ") : "",
        requiresShipping: product.requiresShipping,
        weight: product.weight ? product.weight.toString() : "",
        shippingPrice: product.shippingPrice ? (product.shippingPrice / 100).toFixed(2) : "",
        status: product.status,
      });
      setPrimaryImageUrl(product.primaryImage || "");
      setUploadedImages(product.images || []);
      setHasVariants(product.hasVariants || false);

    }
  }, [product]);

  // Handle image upload
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload-product-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  // Handle primary image drop
  const onPrimaryImageDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setUploadProgress({ ...uploadProgress, primary: true });

    try {
      const url = await uploadImage(file);
      setPrimaryImageUrl(url);
    } catch (error) {
      alert(`Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
      setUploadProgress({ ...uploadProgress, primary: false });
    }
  };

  // Handle additional images drop
  const onAdditionalImagesDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        setUploadProgress((prev) => ({ ...prev, [`additional-${index}`]: true }));
        const url = await uploadImage(file);
        setUploadProgress((prev) => ({ ...prev, [`additional-${index}`]: false }));
        return url;
      });

      const urls = await Promise.all(uploadPromises);
      const newImages = [...uploadedImages, ...urls];
      setUploadedImages(newImages);
    } catch (error) {
      console.error("❌ Upload error:", error);
      alert(`Failed to upload images: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Remove primary image
  const removePrimaryImage = async () => {
    try {
      await updateProduct({
        productId,
        primaryImage: undefined,
      });

      setPrimaryImageUrl("");
    } catch (error) {
      alert(
        `Failed to delete primary image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  // Remove image from additional images
  const removeImage = async (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);

    try {
      await updateProduct({
        productId,
        images: newImages.length > 0 ? newImages : undefined,
      });

      setUploadedImages(newImages);
    } catch (error) {
      alert(`Failed to delete image: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Set as primary image
  const setAsPrimary = async (url: string) => {
    try {
      await updateProduct({
        productId,
        primaryImage: url,
      });

      setPrimaryImageUrl(url);
    } catch (error) {
      alert(
        `Failed to set as primary image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  // Dropzone configs
  const primaryDropzone = useDropzone({
    onDrop: onPrimaryImageDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: false,
    disabled: isUploading,
  });

  const additionalDropzone = useDropzone({
    onDrop: onAdditionalImagesDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: true,
    disabled: isUploading,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateProduct({
        productId,
        name: formData.name,
        description: formData.description,
        price: Math.round(parseFloat(formData.price) * 100), // Convert to cents
        compareAtPrice: formData.compareAtPrice
          ? Math.round(parseFloat(formData.compareAtPrice) * 100)
          : undefined,
        sku: formData.sku || undefined,
        inventoryQuantity: parseInt(formData.inventoryQuantity),
        trackInventory: formData.trackInventory,
        allowBackorder: formData.allowBackorder || undefined,
        category: formData.category || undefined,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : undefined,
        primaryImage: primaryImageUrl || undefined,
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        hasVariants: false, // Simplified for now
        requiresShipping: formData.requiresShipping,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        shippingPrice: formData.shippingPrice
          ? Math.round(parseFloat(formData.shippingPrice) * 100)
          : undefined,
        status: formData.status,
      });

      router.push("/admin/products");
    } catch (error: unknown) {
      alert(`Failed to update product: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (product === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading product...</span>
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">This product does not exist.</p>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-1">Update product details</p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </Link>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="e.g., SteppersLife T-Shirt"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Describe your product..."
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="29.99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compare at Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.compareAtPrice}
                onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="39.99"
              />
              <p className="text-xs text-gray-500 mt-1">Show original price (for discounts)</p>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="TSHIRT-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
              <input
                type="number"
                required
                value={formData.inventoryQuantity}
                onChange={(e) => setFormData({ ...formData, inventoryQuantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="100"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.trackInventory}
                onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
              />
              <span className="text-sm text-gray-700">Track inventory quantity</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.allowBackorder}
                onChange={(e) => setFormData({ ...formData, allowBackorder: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
              />
              <span className="text-sm text-gray-700">Allow backorders when out of stock</span>
            </label>
          </div>
        </div>

        {/* Organization */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Organization</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Apparel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="t-shirt, cotton, unisex"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Product Images</h2>

          <div className="space-y-6">
            {/* Primary Image Drop Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Image</label>

              {primaryImageUrl ? (
                <div className="relative w-full aspect-square border-2 border-green-300 rounded-lg overflow-hidden group">
                  <Image
                    src={primaryImageUrl}
                    alt="Primary product image"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3" fill="white" />
                    Primary
                  </div>
                  <button
                    type="button"
                    onClick={removePrimaryImage}
                    className="absolute bottom-2 right-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete primary image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  {...primaryDropzone.getRootProps()}
                  className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    primaryDropzone.isDragActive
                      ? "border-primary bg-accent"
                      : "border-gray-300 hover:border-primary hover:bg-gray-50"
                  } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input {...primaryDropzone.getInputProps()} />
                  {uploadProgress.primary ? (
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                      <p className="text-sm text-gray-600">Uploading primary image...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-600 mb-1">
                        {primaryDropzone.isDragActive
                          ? "Drop the image here"
                          : "Drag & drop primary image here, or click to select"}
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Additional Images Drop Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Images ({uploadedImages.length} images)
              </label>
              {/* Image Grid */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {uploadedImages.map((url, index) => (
                    <div
                      key={index}
                      className="relative w-full aspect-square border-2 border-gray-200 rounded-lg overflow-hidden group"
                    >
                      <Image
                        src={url}
                        alt={`Product image ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAsPrimary(url)}
                          className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors opacity-0 group-hover:opacity-100"
                          title="Set as primary"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Drop Zone */}
              <div
                {...additionalDropzone.getRootProps()}
                className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  additionalDropzone.isDragActive
                    ? "border-primary bg-accent"
                    : "border-gray-300 hover:border-primary hover:bg-gray-50"
                } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input {...additionalDropzone.getInputProps()} />
                {isUploading &&
                Object.keys(uploadProgress).some((k) => k.startsWith("additional-")) ? (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Uploading images...</p>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      {additionalDropzone.isDragActive
                        ? "Drop the images here"
                        : "Drag & drop additional images, or click to select"}
                    </p>
                    <p className="text-xs text-gray-500">Upload multiple images at once</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requiresShipping}
                onChange={(e) => setFormData({ ...formData, requiresShipping: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
              />
              <span className="text-sm text-gray-700">This product requires shipping</span>
            </label>

            {formData.requiresShipping && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (grams)
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.shippingPrice}
                    onChange={(e) => setFormData({ ...formData, shippingPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="5.99"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Delivery shipping cost (pickup is free)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Variants */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Product Variants</h2>

          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={async (e) => {
                const newValue = e.target.checked;
                setHasVariants(newValue);
                try {
                  await updateProduct({
                    productId,
                    hasVariants: newValue,
                  });
                } catch (error) {
                  alert(
                    `Failed to update hasVariants: ${error instanceof Error ? error.message : String(error)}`
                  );
                }
              }}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
            />
            <span className="text-sm text-gray-700">This product has variants (colors/sizes)</span>
          </label>

          {hasVariants && product && (
            <VariantsManager
              key={variantsKey}
              productId={productId}
              productName={product.name}
              basePrice={Math.round(parseFloat(formData.price) * 100)}
              baseSku={formData.sku}
              variants={product.variants}
              onVariantsChange={() => setVariantsKey((k) => k + 1)}
            />
          )}
        </div>

        {/* Product Options */}
        {product && (
          <div>
            <ProductOptionsManager productId={productId} options={product.options} />
          </div>
        )}

        {/* Status */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Status</h2>

          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as typeof formData.status })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="DRAFT">Draft (not visible to customers)</option>
            <option value="ACTIVE">Active (visible to customers)</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <Link
            href="/admin/products"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Updating..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
