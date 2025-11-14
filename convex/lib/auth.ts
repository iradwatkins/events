import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get the current authenticated user from the context.
 * Throws an error if user is not authenticated or not found in database.
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  console.log("[getCurrentUser] Identity:", JSON.stringify(identity, null, 2));

  // TEMPORARY WORKAROUND: Since Convex auth isn't working with our custom JWT yet,
  // we need to use a different approach. Check if there's a custom header or session.
  // This is a TEMPORARY solution until we properly configure Convex auth.

  if (!identity) {
    // For now, throw an error to indicate auth is required
    // In the future, we'll implement proper JWT verification via Convex
    throw new Error("Not authenticated - Convex auth configuration needs to be fixed");
  }

  // Extract email from identity
  // Convex auth identity can have different structures depending on the provider
  const email = identity.email || identity.tokenIdentifier?.split("|")[1];

  if (!email || typeof email !== 'string') {
    console.error("[getCurrentUser] No email found in identity:", identity);
    throw new Error("No email found in authentication token");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email as string))
    .first();

  if (!user) {
    console.error("[getCurrentUser] User not found for email:", email);
    throw new Error("User not found in database");
  }

  console.log("[getCurrentUser] User found:", user._id, user.email);
  return user;
}

/**
 * Verify that the current user owns the specified event or is an admin.
 * Throws an error if not authorized.
 * Returns both the user and event for convenience.
 */
export async function requireEventOwnership(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<"events">
) {
  const user = await getCurrentUser(ctx);
  const event = await ctx.db.get(eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  // Admins can access any event
  if (user.role === "admin") {
    return { user, event };
  }

  // Organizers can only access their own events
  if (event.organizerId !== user._id) {
    throw new Error("Not authorized to access this event");
  }

  return { user, event };
}

/**
 * Verify that the current user is an admin.
 * Throws an error if not an admin.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);

  if (user.role !== "admin") {
    throw new Error("Admin access required");
  }

  return user;
}

/**
 * Check if the current user can access an event.
 * Returns true if user is admin or event organizer, false otherwise.
 */
export async function canAccessEvent(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<"events">
): Promise<boolean> {
  try {
    await requireEventOwnership(ctx, eventId);
    return true;
  } catch {
    return false;
  }
}
