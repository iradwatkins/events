import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  primaryImage?: string;
  trackInventory?: boolean;
  inventoryQuantity?: number;
}

interface ProductsSectionProps {
  products: Product[];
}

export function ProductsSection({ products }: ProductsSectionProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-primary" />
            Shop Products
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Browse our exclusive stepping merchandise and products
          </p>
        </div>
        <Link href="/shop" className="text-primary hover:underline font-medium">
          View All Products →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.slice(0, 8).map((product) => (
          <div
            key={product._id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 duration-200"
          >
            <Link href={`/shop/${product._id}`}>
              <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                {product.primaryImage ? (
                  <Image
                    src={product.primaryImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                    SALE
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-primary">
                      ${(product.price / 100).toFixed(2)}
                    </span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        ${(product.compareAtPrice / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {product.trackInventory && (
                    <span
                      className={`text-xs ${product.inventoryQuantity && product.inventoryQuantity > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {product.inventoryQuantity && product.inventoryQuantity > 0
                        ? `${product.inventoryQuantity} in stock`
                        : "Out of stock"}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
