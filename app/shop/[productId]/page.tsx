"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import {
  ShoppingCart as ShoppingCartIcon,
  ArrowLeft,
  Package,
  Star,
  Truck,
  Shield,
  CreditCard,
  Plus,
  Minus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import ProductOptionInput, {
  type ProductOption,
  type SelectedOption,
} from "@/components/shop/ProductOptionInput";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as Id<"products">;

  const product = useQuery(api.products.queries.getProductById, { productId });
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ size?: string; color?: string }>({});
  const [selectedProductOptions, setSelectedProductOptions] = useState<
    Record<string, SelectedOption>
  >({});

  if (product === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  // Get current variant if selections are complete
  const currentVariant =
    product.hasVariants && product.variants && selectedOptions.size && selectedOptions.color
      ? product.variants.find(
          (v: any) =>
            v.options.size === selectedOptions.size && v.options.color === selectedOptions.color
        )
      : null;

  // Use variant image if available, otherwise use product images
  const allImages = currentVariant?.image
    ? ([currentVariant.image, product.primaryImage, ...(product.images || [])].filter(
        Boolean
      ) as string[])
    : ([product.primaryImage, ...(product.images || [])].filter(Boolean) as string[]);

  const isOutOfStock = product.trackInventory && product.inventoryQuantity === 0;
  const maxQuantity = product.trackInventory ? product.inventoryQuantity : 99;

  // Calculate total options price modifier
  const totalOptionsPriceModifier = Object.values(selectedProductOptions).reduce(
    (sum, option) => sum + option.priceModifier,
    0
  );

  // Calculate final price (base/variant + options)
  const basePrice = currentVariant?.price ?? product.price;
  const finalPrice = basePrice + totalOptionsPriceModifier;

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleOptionChange = (optionId: string, selectedOption: SelectedOption | undefined) => {
    if (selectedOption) {
      setSelectedProductOptions((prev) => ({
        ...prev,
        [optionId]: selectedOption,
      }));
    } else {
      setSelectedProductOptions((prev) => {
        const newOptions = { ...prev };
        delete newOptions[optionId];
        return newOptions;
      });
    }
  };

  const handleAddToCart = () => {
    // If product has variants, find the selected variant
    let variant = null;
    let variantPrice = product.price;
    let productImage = product.primaryImage;

    if (product.hasVariants && product.variants && selectedOptions.size && selectedOptions.color) {
      variant = product.variants.find(
        (v: any) =>
          v.options.size === selectedOptions.size && v.options.color === selectedOptions.color
      );
      if (variant) {
        variantPrice = variant.price || product.price;
        productImage = variant.image || product.primaryImage;
      }
    }

    // Convert selectedProductOptions to array
    const productOptionsArray = Object.values(selectedProductOptions);

    addToCart({
      productId: product._id,
      productName: product.name,
      productPrice: finalPrice, // Includes base price + options
      productImage,
      quantity,
      ...(variant && {
        variantId: variant.id,
        variantName: variant.name,
        variantOptions: variant.options,
      }),
      ...(productOptionsArray.length > 0 && {
        productOptions: productOptionsArray,
        optionsPriceModifier: totalOptionsPriceModifier,
      }),
    });
  };

  const handleBuyNow = () => {
    // If product has variants, find the selected variant
    let variant = null;
    let variantPrice = product.price;
    let productImage = product.primaryImage;

    if (product.hasVariants && product.variants && selectedOptions.size && selectedOptions.color) {
      variant = product.variants.find(
        (v: any) =>
          v.options.size === selectedOptions.size && v.options.color === selectedOptions.color
      );
      if (variant) {
        variantPrice = variant.price || product.price;
        productImage = variant.image || product.primaryImage;
      }
    }

    // Convert selectedProductOptions to array
    const productOptionsArray = Object.values(selectedProductOptions);

    addToCart({
      productId: product._id,
      productName: product.name,
      productPrice: finalPrice, // Includes base price + options
      productImage,
      quantity,
      ...(variant && {
        variantId: variant.id,
        variantName: variant.name,
        variantOptions: variant.options,
      }),
      ...(productOptionsArray.length > 0 && {
        productOptions: productOptionsArray,
        optionsPriceModifier: totalOptionsPriceModifier,
      }),
    });
    router.push("/shop/checkout");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Shop
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {allImages[selectedImage] ? (
                  <Image
                    src={allImages[selectedImage]}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? "border-primary"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        width={150}
                        height={150}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Product Name & Category */}
              <div>
                {product.category && (
                  <span className="inline-block px-3 py-1 bg-accent text-primary text-sm rounded-full mb-3">
                    {product.category}
                  </span>
                )}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price */}
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-primary">
                    ${(finalPrice / 100).toFixed(2)}
                  </span>
                  {product.compareAtPrice &&
                    product.compareAtPrice > (currentVariant?.price ?? product.price) && (
                      <>
                        <span className="text-2xl text-gray-500 line-through">
                          ${(product.compareAtPrice / 100).toFixed(2)}
                        </span>
                        <span className="px-2 py-1 bg-red-600 text-white text-sm rounded-full font-semibold">
                          {Math.round(
                            (1 -
                              (currentVariant?.price ?? product.price) / product.compareAtPrice) *
                              100
                          )}
                          % OFF
                        </span>
                      </>
                    )}
                </div>
                {currentVariant && currentVariant.price !== product.price && (
                  <p className="text-sm text-gray-600 mt-1">
                    Base price: ${(product.price / 100).toFixed(2)}
                  </p>
                )}
                {totalOptionsPriceModifier !== 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Options: {totalOptionsPriceModifier >= 0 ? "+" : ""}$
                    {(totalOptionsPriceModifier / 100).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="border-t border-b border-gray-200 py-4">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {/* Stock Status */}
              {product.trackInventory && (
                <div>
                  {isOutOfStock ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <Package className="w-5 h-5" />
                      <span className="font-semibold">Out of Stock</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <Package className="w-5 h-5" />
                      <span className="font-semibold">{product.inventoryQuantity} in stock</span>
                    </div>
                  )}
                </div>
              )}

              {/* SKU */}
              {product.sku && (
                <div className="text-sm text-gray-600">
                  SKU: <span className="font-mono">{product.sku}</span>
                </div>
              )}

              {/* Product Variants */}
              {product.hasVariants && product.variants && product.variants.length > 0 && (
                <div className="space-y-4">
                  {/* Extract unique sizes and colors */}
                  {(() => {
                    const sizes = Array.from(
                      new Set(product.variants.map((v: any) => v.options.size).filter(Boolean))
                    );
                    const colors = Array.from(
                      new Set(product.variants.map((v: any) => v.options.color).filter(Boolean))
                    );

                    return (
                      <>
                        {/* Size Selection */}
                        {sizes.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Size{" "}
                              {selectedOptions.size && (
                                <span className="text-primary">({selectedOptions.size})</span>
                              )}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {sizes.map((size: any) => (
                                <button
                                  key={size}
                                  onClick={() => setSelectedOptions({ ...selectedOptions, size })}
                                  className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                                    selectedOptions.size === size
                                      ? "border-primary bg-primary text-white"
                                      : "border-gray-300 hover:border-primary"
                                  }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Color Selection */}
                        {colors.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Color{" "}
                              {selectedOptions.color && (
                                <span className="text-primary">({selectedOptions.color})</span>
                              )}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {colors.map((color: any) => (
                                <button
                                  key={color}
                                  onClick={() => setSelectedOptions({ ...selectedOptions, color })}
                                  className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                                    selectedOptions.color === color
                                      ? "border-primary bg-primary text-white"
                                      : "border-gray-300 hover:border-primary"
                                  }`}
                                >
                                  {color}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Selected Variant Info */}
                        {selectedOptions.size &&
                          selectedOptions.color &&
                          (() => {
                            const variant = product.variants.find(
                              (v: any) =>
                                v.options.size === selectedOptions.size &&
                                v.options.color === selectedOptions.color
                            );
                            if (variant) {
                              return (
                                <div className="bg-accent/50 border border-border rounded-lg p-3">
                                  <p className="text-sm text-foreground">
                                    <strong>{variant.name}</strong>
                                    {variant.inventoryQuantity > 0 ? (
                                      <span className="text-green-600 ml-2">
                                        ({variant.inventoryQuantity} available)
                                      </span>
                                    ) : (
                                      <span className="text-red-600 ml-2">(Out of stock)</span>
                                    )}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          })()}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Product Options */}
              {product.options && product.options.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Customization Options</h3>
                  {product.options
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((option) => (
                      <ProductOptionInput
                        key={option.id}
                        option={option as ProductOption}
                        value={selectedProductOptions[option.id]}
                        onChange={(selectedOption) => handleOptionChange(option.id, selectedOption)}
                      />
                    ))}
                </div>
              )}

              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-6 py-2 font-semibold">{quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= maxQuantity}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-600">
                      Total:{" "}
                      <span className="font-bold text-primary text-lg">
                        ${((finalPrice * quantity) / 100).toFixed(2)}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-5 h-5" />
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-primary text-primary text-lg font-semibold rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  Add to Cart
                </button>
              </div>

              {/* Product Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Secure Payment</p>
                </div>
                {product.requiresShipping && (
                  <div className="text-center">
                    <Truck className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-xs text-gray-600">Fast Shipping</p>
                  </div>
                )}
                <div className="text-center">
                  <Star className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Quality Assured</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
