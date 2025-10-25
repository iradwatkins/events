# Story 2.6: Edit Event

**Epic:** Epic 2 - Event Creation & Management
**Priority:** P1
**Effort:** 3 points
**Sprint:** Week 9
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** edit my existing events
**So that** I can update details or fix mistakes

---

## Acceptance Criteria

- [ ] Edit page at `/organizer/events/[eventId]/edit`
- [ ] Form pre-populated with existing data
- [ ] Can update all fields (name, date, description, image, etc.)
- [ ] Validation prevents invalid changes
- [ ] Warning if tickets already sold (ticketed events)
- [ ] Success message after save
- [ ] Redirect to event detail page

---

## Tasks

### 1. Create `updateEvent` Mutation

**Files:**
- `convex/events/mutations.ts`

**Code:**
```typescript
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    // ... other optional fields
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;
    
    await ctx.db.patch(eventId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});
```

---

### 2. Create Edit Page

**Files:**
- `app/(dashboard)/organizer/events/[eventId]/edit/page.tsx`

**Features:**
- Fetch event data
- Pre-populate form
- Submit updates
- Handle errors

---

### 3. Add Warning for Sold Tickets

If `quantitySold > 0`, show warning: "Tickets have been sold. Some changes may affect attendees."

---

## Testing

- [ ] Can edit all event types
- [ ] Changes save correctly
- [ ] Warning displays when tickets sold
- [ ] Validation works

---

## Dev Agent Record

[To be completed by dev agent]

---

**Created:** October 25, 2025
**Owner:** John (PM Agent)
