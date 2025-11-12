/**
 * Centralized Permission Checker
 *
 * This module provides reusable permission checking functions to avoid
 * duplicating permission logic throughout the codebase.
 *
 * @module permissions
 */

import { USER_ROLES, STAFF_ROLES, HIERARCHY_CONFIG, type UserRole, type StaffRole } from "./roles";
import type { Doc, Id } from "../_generated/dataModel";

/**
 * Permission checking utility class
 */
export class PermissionChecker {
  /**
   * Check if user is a platform administrator
   */
  static isAdmin(user: Doc<"users"> | null | undefined): boolean {
    return user?.role === USER_ROLES.ADMIN;
  }

  /**
   * Check if user is an event organizer (any organizer, not specific to event)
   */
  static isOrganizer(user: Doc<"users"> | null | undefined): boolean {
    return user?.role === USER_ROLES.ORGANIZER || this.isAdmin(user);
  }

  /**
   * Check if user is the organizer of a specific event
   */
  static isEventOrganizer(
    user: Doc<"users"> | null | undefined,
    event: Doc<"events"> | null | undefined
  ): boolean {
    if (!user || !event) return false;
    return this.isAdmin(user) || event.organizerId === user._id;
  }

  /**
   * Check if user can manage a specific staff member
   * (Either admin, event organizer, or parent staff who assigned them)
   */
  static async canManageStaff(
    ctx: any, // QueryCtx or MutationCtx
    user: Doc<"users"> | null | undefined,
    staff: Doc<"eventStaff"> | null | undefined
  ): Promise<boolean> {
    if (!user || !staff) return false;

    // Admins can manage anyone
    if (this.isAdmin(user)) return true;

    // Event organizer can manage their event's staff
    if (staff.organizerId === user._id) return true;

    // Parent staff can manage their assigned sub-sellers
    if (staff.assignedByStaffId) {
      const parentStaff = await ctx.db.get(staff.assignedByStaffId);
      if (parentStaff?.staffUserId === user._id) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if staff member can assign sub-sellers
   */
  static canAssignSubSellers(staff: Doc<"eventStaff"> | null | undefined): boolean {
    if (!staff) return false;
    return staff.canAssignSubSellers === true;
  }

  /**
   * Check if staff hierarchy is within allowed depth
   */
  static isWithinHierarchyLimit(currentLevel: number): boolean {
    return currentLevel < HIERARCHY_CONFIG.MAX_DEPTH;
  }

  /**
   * Calculate next hierarchy level
   */
  static getNextHierarchyLevel(parentLevel: number): number {
    return parentLevel + 1;
  }

  /**
   * Check if user owns a ticket
   */
  static ownsTicket(
    user: Doc<"users"> | null | undefined,
    ticket: Doc<"tickets"> | null | undefined
  ): boolean {
    if (!user || !ticket) return false;
    return ticket.attendeeEmail === user.email;
  }

  /**
   * Check if user can transfer tickets for an event
   */
  static async canTransferTickets(
    ctx: any,
    user: Doc<"users"> | null | undefined,
    eventId: Id<"events">
  ): Promise<boolean> {
    if (!user) return false;

    // Get event
    const event = await ctx.db.get(eventId);
    if (!event) return false;

    // Admins and event organizers can always transfer
    if (this.isEventOrganizer(user, event)) return true;

    // Check if user is active staff for this event
    const staff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
      .filter((q: any) => q.eq(q.field("staffUserId"), user._id))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .first();

    return staff !== null;
  }

  /**
   * Check if user can scan tickets for an event
   */
  static async canScanTickets(
    ctx: any,
    user: Doc<"users"> | null | undefined,
    eventId: Id<"events">
  ): Promise<boolean> {
    if (!user) return false;

    // Get event
    const event = await ctx.db.get(eventId);
    if (!event) return false;

    // Admins and event organizers can always scan
    if (this.isEventOrganizer(user, event)) return true;

    // Check if user is staff with scanning permissions
    const staff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
      .filter((q: any) => q.eq(q.field("staffUserId"), user._id))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .first();

    if (!staff) return false;

    // STAFF role always has permission
    if (staff.role === STAFF_ROLES.STAFF) return true;

    // TEAM_MEMBERS and ASSOCIATES need explicit canScan permission
    if (staff.role === STAFF_ROLES.TEAM_MEMBERS && staff.canScan === true) return true;
    if (staff.role === STAFF_ROLES.ASSOCIATES && staff.canScan === true) return true;

    return false;
  }

  /**
   * Check if user can sell tickets for an event
   */
  static async canSellTickets(
    ctx: any,
    user: Doc<"users"> | null | undefined,
    eventId: Id<"events">
  ): Promise<boolean> {
    if (!user) return false;

    // Get event
    const event = await ctx.db.get(eventId);
    if (!event) return false;

    // Admins and event organizers can always sell
    if (this.isEventOrganizer(user, event)) return true;

    // Check if user is active SUPPORT_STAFF or SUB_RESELLER (or legacy SELLER)
    const staff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
      .filter((q: any) => q.eq(q.field("staffUserId"), user._id))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .first();

    if (!staff) return false;

    // Can sell if TEAM_MEMBERS or ASSOCIATES
    if (staff.role === STAFF_ROLES.TEAM_MEMBERS) return true;
    if (staff.role === STAFF_ROLES.ASSOCIATES) return true;
    // STAFF can sell only if organizer gave permission
    if (staff.role === STAFF_ROLES.STAFF && staff.canScan === true) return true;

    return false;
  }

  /**
   * Check if user can view event analytics
   */
  static async canViewAnalytics(
    ctx: any,
    user: Doc<"users"> | null | undefined,
    eventId: Id<"events">
  ): Promise<boolean> {
    if (!user) return false;

    const event = await ctx.db.get(eventId);
    if (!event) return false;

    // Only admins and event organizers can view analytics
    return this.isEventOrganizer(user, event);
  }

  /**
   * Check if user can modify event details
   */
  static async canModifyEvent(
    ctx: any,
    user: Doc<"users"> | null | undefined,
    eventId: Id<"events">
  ): Promise<boolean> {
    if (!user) return false;

    const event = await ctx.db.get(eventId);
    if (!event) return false;

    // Only admins and event organizers can modify events
    return this.isEventOrganizer(user, event);
  }

  /**
   * Check if user can delete an event
   */
  static async canDeleteEvent(
    ctx: any,
    user: Doc<"users"> | null | undefined,
    eventId: Id<"events">
  ): Promise<boolean> {
    if (!user) return false;

    const event = await ctx.db.get(eventId);
    if (!event) return false;

    // Only admins and event organizers can delete events
    return this.isEventOrganizer(user, event);
  }

  /**
   * Check if user can create ticketed events
   * (Some organizers are restricted to only Save The Date and Free events)
   */
  static canCreateTicketedEvents(user: Doc<"users"> | null | undefined): boolean {
    if (!user) return false;
    // Admins can always create ticketed events
    if (this.isAdmin(user)) return true;
    // If the flag is explicitly set to false, user cannot create ticketed events
    // If the flag is undefined or true, user can create ticketed events
    return user.canCreateTicketedEvents !== false;
  }

  /**
   * Check if action should be allowed in production
   * (Used to prevent testing mode in production)
   */
  static isProductionSafe(): boolean {
    // In production, require strict authentication
    // This can be enhanced with environment variable checks
    return process.env.NODE_ENV === "production";
  }

  /**
   * Get permission error message
   */
  static getPermissionError(action: string): string {
    return `You don't have permission to ${action}. Please contact an administrator if you believe this is an error.`;
  }
}

/**
 * Convenience functions for common permission checks
 */

export function requireAdmin(user: Doc<"users"> | null | undefined): void {
  if (!PermissionChecker.isAdmin(user)) {
    throw new Error(PermissionChecker.getPermissionError("perform this action"));
  }
}

export function requireOrganizer(user: Doc<"users"> | null | undefined): void {
  if (!PermissionChecker.isOrganizer(user)) {
    throw new Error(PermissionChecker.getPermissionError("access organizer features"));
  }
}

export async function requireEventOrganizer(
  ctx: any,
  user: Doc<"users"> | null | undefined,
  eventId: Id<"events">
): Promise<void> {
  const event = await ctx.db.get(eventId);
  if (!PermissionChecker.isEventOrganizer(user, event)) {
    throw new Error(PermissionChecker.getPermissionError("manage this event"));
  }
}

export async function requireCanManageStaff(
  ctx: any,
  user: Doc<"users"> | null | undefined,
  staff: Doc<"eventStaff">
): Promise<void> {
  const canManage = await PermissionChecker.canManageStaff(ctx, user, staff);
  if (!canManage) {
    throw new Error(PermissionChecker.getPermissionError("manage this staff member"));
  }
}
