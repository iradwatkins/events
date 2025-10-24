import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Basic schema for event ticketing platform with Stripe integration
export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    emailVerified: v.optional(v.boolean()),
    image: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("organizer"), v.literal("user"))),
    // Stripe fields
    stripeCustomerId: v.optional(v.string()),
    stripeConnectedAccountId: v.optional(v.string()), // For event organizers
  }).index("by_email", ["email"]),

  events: defineTable({
    title: v.string(),
    description: v.string(),
    organizerId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
    venue: v.string(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled")),
    createdAt: v.number(),
  }).index("by_organizer", ["organizerId"])
    .index("by_status", ["status"]),
});
