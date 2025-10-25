# Story 2.5: Event Listing Dashboard

**Epic:** Epic 2 - Event Creation & Management
**Priority:** P0
**Effort:** 3 points
**Sprint:** Week 1-2
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** view all my events in a dashboard
**So that** I can manage and track my events

---

## Acceptance Criteria

- [ ] Dashboard at `/organizer/events`
- [ ] Events grouped by status (Draft, Published)
- [ ] Grid layout with event cards
- [ ] Real-time updates (new events appear immediately)
- [ ] "Create New Event" button prominent
- [ ] Empty state for new organizers
- [ ] Click event card to view details

---

## Tasks

### 1. Create `getOrganizerEvents` Query

**Files:**
- `convex/events/queries.ts`

**Code:**
```typescript
export const getOrganizerEvents = query({
  args: {},
  handler: async (ctx) => {
    // TODO: Filter by userId when auth implemented
    const events = await ctx.db
      .query("events")
      .order("desc")
      .collect();

    return events;
  },
});
```

---

### 2. Create Dashboard Page

**Files:**
- `app/(dashboard)/organizer/events/page.tsx`

**Features:**
- Use `getOrganizerEvents` query (real-time)
- Group events by status
- Display event cards in grid
- "Create Event" button
- Empty state component

---

### 3. Update EventCard Component

**Files:**
- `components/events/EventCard.tsx`

**Display:**
- Event image
- Name
- Date
- Status badge (Draft/Published)
- Click to navigate

---

## Testing

- [ ] Dashboard loads all events
- [ ] Events grouped correctly
- [ ] Real-time updates work (create event, see it appear)
- [ ] Empty state displays
- [ ] Mobile responsive

---

## Dev Agent Record

[To be completed by dev agent]

---

**Created:** October 25, 2025
**Owner:** John (PM Agent)
