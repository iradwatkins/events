/**
 * Shared ConvexHttpClient singleton
 *
 * This ensures we reuse a single client instance across all API routes
 * instead of creating new instances for each request.
 *
 * Benefits:
 * - Reduces memory overhead
 * - Reuses connection pooling
 * - Ensures consistent configuration
 */

import { ConvexHttpClient } from "convex/browser";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
}

/**
 * Shared Convex HTTP client instance
 * Use this in API routes instead of creating new instances
 */
export const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
