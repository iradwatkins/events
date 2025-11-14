import { Suspense } from "react";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { HomePageContent } from "@/components/homepage/HomePageContent";
import { ProductsSection } from "@/components/homepage/ProductsSection";

// Initialize Convex client for server-side data fetching
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
const convex = new ConvexHttpClient(convexUrl);

// Force dynamic rendering - always fetch fresh data (no static caching)
// This ensures events appear immediately after being published
export const dynamic = "force-dynamic";
export const revalidate = 0; // Disable ISR caching

// Server Component - fetches data at build time or on request
export default async function Home() {
  // Fetch upcoming events on the server
  const events = await convex.query(api.public.queries.getPublishedEvents, { limit: 100 });

  // Fetch active products on the server
  const products = await convex.query(api.products.queries.getActiveProducts);

  // Remove duplicates (just in case)
  const uniqueEvents = events.filter(
    (event, index, self) => index === self.findIndex((e) => e._id === event._id)
  );

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Client Island: Interactive event browsing */}
        <Suspense fallback={<LoadingSkeleton />}>
          <HomePageContent initialEvents={uniqueEvents} />
        </Suspense>

        {/* Server Component: Products section */}
        <Suspense fallback={null}>
          <ProductsSection products={products} />
        </Suspense>

        {/* Footer */}
        <PublicFooter />
      </div>
    </>
  );
}

// Loading skeleton for better UX
function LoadingSkeleton() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        ))}
      </div>
    </main>
  );
}
