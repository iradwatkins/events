import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Save current seating chart as a template
 */
export const saveSeatingChartAsTemplate = mutation({
  args: {
    eventId: v.id("events"),
    templateName: v.string(),
    description: v.string(),
    category: v.optional(v.union(
      v.literal("WEDDING"),
      v.literal("CORPORATE"),
      v.literal("CONCERT"),
      v.literal("GALA"),
      v.literal("CONFERENCE"),
      v.literal("OTHER")
    )),
    isPublic: v.boolean(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email || ""))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the seating chart
    const seatingChart = await ctx.db
      .query("seatingCharts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!seatingChart) {
      throw new Error("Seating chart not found");
    }

    // Create template
    const templateId = await ctx.db.insert("seatingTemplates", {
      name: args.templateName,
      description: args.description,
      creatorId: user._id,
      seatingStyle: seatingChart.seatingStyle || "TABLE_BASED",
      sections: seatingChart.sections as any,
      totalCapacity: seatingChart.totalSeats,
      isPublic: args.isPublic,
      usageCount: 0,
      category: args.category,
      tags: args.tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { templateId };
  },
});

/**
 * Apply a template to an event
 */
export const applyTemplateToEvent = mutation({
  args: {
    eventId: v.id("events"),
    templateId: v.id("seatingTemplates"),
  },
  handler: async (ctx, args) => {
    // Get the template
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Get or create seating chart for event
    let seatingChart = await ctx.db
      .query("seatingCharts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (seatingChart) {
      // Update existing chart
      await ctx.db.patch(seatingChart._id, {
        seatingStyle: template.seatingStyle,
        sections: template.sections,
        totalSeats: template.totalCapacity,
        updatedAt: Date.now(),
      });
    } else {
      // Create new chart
      const chartId = await ctx.db.insert("seatingCharts", {
        eventId: args.eventId,
        name: "Seating Chart",
        seatingStyle: template.seatingStyle,
        sections: template.sections,
        totalSeats: template.totalCapacity,
        reservedSeats: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      seatingChart = await ctx.db.get(chartId);
    }

    // Increment template usage count
    await ctx.db.patch(args.templateId, {
      usageCount: template.usageCount + 1,
    });

    return { seatingChartId: seatingChart!._id };
  },
});

/**
 * Get all templates (public + user's private ones)
 */
export const getAvailableTemplates = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      // Not authenticated - show only public templates
      const publicTemplates = await ctx.db
        .query("seatingTemplates")
        .withIndex("by_public", (q) => q.eq("isPublic", true))
        .collect();

      return publicTemplates;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email || ""))
      .first();

    if (!user) {
      return [];
    }

    // Get user's own templates
    const userTemplates = await ctx.db
      .query("seatingTemplates")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .collect();

    // Get public templates
    const publicTemplates = await ctx.db
      .query("seatingTemplates")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    // Combine and dedupe
    const allTemplates = [...userTemplates];
    const userTemplateIds = new Set(userTemplates.map(t => t._id));

    publicTemplates.forEach(template => {
      if (!userTemplateIds.has(template._id)) {
        allTemplates.push(template);
      }
    });

    // Sort by usage count descending
    return allTemplates.sort((a, b) => b.usageCount - a.usageCount);
  },
});

/**
 * Get user's templates
 */
export const getMyTemplates = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email || ""))
      .first();

    if (!user) {
      return [];
    }

    const templates = await ctx.db
      .query("seatingTemplates")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .collect();

    return templates.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Delete a template
 */
export const deleteTemplate = mutation({
  args: {
    templateId: v.id("seatingTemplates"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email || ""))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check ownership
    if (template.creatorId !== user._id) {
      throw new Error("Not authorized to delete this template");
    }

    await ctx.db.delete(args.templateId);

    return { success: true };
  },
});

/**
 * Update template metadata
 */
export const updateTemplate = mutation({
  args: {
    templateId: v.id("seatingTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    category: v.optional(v.union(
      v.literal("WEDDING"),
      v.literal("CORPORATE"),
      v.literal("CONCERT"),
      v.literal("GALA"),
      v.literal("CONFERENCE"),
      v.literal("OTHER")
    )),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email || ""))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check ownership
    if (template.creatorId !== user._id) {
      throw new Error("Not authorized to update this template");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.category !== undefined) updates.category = args.category;
    if (args.tags !== undefined) updates.tags = args.tags;

    await ctx.db.patch(args.templateId, updates);

    return { success: true };
  },
});
