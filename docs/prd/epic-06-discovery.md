# Epic 6: Search & Discovery

**Priority:** P1 (High)
**Sprint:** Week 9-10
**Total Points:** 11
**Dependencies:** Epic 2 (Events must be publishable)

---

## Epic Overview

Enable public users to discover events through browsing, searching, and filtering by categories. Includes homepage design with featured events.

### Goals
- Easy event discovery
- Fast search results
- Category-based filtering
- Attractive homepage
- Mobile-responsive listings

### Success Criteria
- [ ] All published events browsable
- [ ] Search results relevant
- [ ] Category filters work
- [ ] Homepage engaging
- [ ] Page load <2 seconds

---

## Story 6.1: Event Listing Page

**Priority:** P0 | **Effort:** 3 points

### Acceptance Criteria
- [ ] Public event listing at `/events`
- [ ] Grid layout with event cards
- [ ] Shows: image, name, date, location, price/free badge
- [ ] Pagination (20 events per page)
- [ ] Sorted by start date (soonest first)
- [ ] Mobile responsive

### Technical Implementation

**Convex Query:** `convex/events/queries.ts`
```typescript
export const getPublicEvents = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const page = args.page || 0;
    const limit = args.limit || 20;

    let query = ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
      .filter((q) => q.gte(q.field("startDate"), Date.now()));

    if (args.category) {
      query = query.filter((q) =>
        q.eq(q.field("categories"), args.category)
      );
    }

    const events = await query
      .order("asc") // By start date
      .paginate({ numItems: limit, cursor: page * limit });

    return events;
  },
});
```

**Component:** `app/(public)/events/page.tsx`
```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EventCard } from "@/components/events/PublicEventCard";

export default function EventsPage() {
  const [page, setPage] = useState(0);
  const events = useQuery(api.events.queries.getPublicEvents, { page });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upcoming Events</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events?.map((event) => (
          <EventCard key={event._id} event={event} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-8">
        <Button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
        >
          Previous
        </Button>
        <Button onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
```

---

## Story 6.2: Category Filtering

**Priority:** P1 | **Effort:** 2 points

### Acceptance Criteria
- [ ] Category filter sidebar/pills
- [ ] Categories: Set, Workshop, Cruise, Outdoors, Holiday, Weekend, Save the Date
- [ ] Multiple categories selectable
- [ ] Event count per category shown
- [ ] Filter updates in real-time

### Technical Implementation

**Component:** `components/events/CategoryFilter.tsx`
```typescript
"use client";

const CATEGORIES = [
  "Set",
  "Workshop",
  "Cruise",
  "Outdoors Steppin",
  "Holiday Event",
  "Weekend Event",
  "Save the Date",
];

export function CategoryFilter({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => {
            if (selected.includes(category)) {
              onChange(selected.filter((c) => c !== category));
            } else {
              onChange([...selected, category]);
            }
          }}
          className={`px-4 py-2 rounded-full border ${
            selected.includes(category)
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
```

---

## Story 6.3: Event Search

**Priority:** P1 | **Effort:** 3 points

### Acceptance Criteria
- [ ] Search bar at top of events page
- [ ] Search by: event name, organizer, location
- [ ] Results update as user types (debounced)
- [ ] "No results" state shown
- [ ] Clear search button

### Technical Implementation

**Convex Query:** `convex/events/queries.ts`
```typescript
export const searchEvents = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query || args.query.length < 2) {
      return [];
    }

    const events = await ctx.db
      .query("events")
      .withSearchIndex("search_events", (q) =>
        q.search("name", args.query)
      )
      .filter((q) => q.eq(q.field("status"), "PUBLISHED"))
      .collect();

    return events.slice(0, 10); // Limit to 10 results
  },
});
```

**Component:** `components/events/EventSearch.tsx`
```typescript
"use client";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function EventSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const results = useQuery(api.events.queries.searchEvents, {
    query: debouncedQuery,
  });

  return (
    <div className="relative">
      <Input
        placeholder="Search events..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query && results && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg z-50">
          {results.length > 0 ? (
            results.map((event) => (
              <Link
                key={event._id}
                href={`/events/${event._id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <p className="font-semibold">{event.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(event.startDate).toLocaleDateString()}
                </p>
              </Link>
            ))
          ) : (
            <p className="p-4 text-gray-500">No events found</p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Story 6.4: Homepage Design

**Priority:** P1 | **Effort:** 3 points

### Acceptance Criteria
- [ ] Hero section with CTA
- [ ] "Upcoming Events" carousel (next 6 events)
- [ ] "Popular Categories" with icons
- [ ] Footer with links
- [ ] Mobile responsive

### Technical Implementation

**Component:** `app/(public)/page.tsx`
```typescript
export default function Homepage() {
  const upcomingEvents = useQuery(api.events.queries.getPublicEvents, {
    limit: 6,
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">
            Discover SteppersLife Events
          </h1>
          <p className="text-xl mb-8">
            Find and book tickets for the best stepping events in your area
          </p>
          <Link href="/events">
            <Button size="lg" variant="secondary">
              Browse Events
            </Button>
          </Link>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents?.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/events?category=${category}`}
                className="p-6 bg-white rounded-lg text-center hover:shadow-lg transition"
              >
                <div className="text-4xl mb-2">{getCategoryIcon(category)}</div>
                <p className="font-semibold">{category}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2025 SteppersLife. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
```

---

## Epic-Level Acceptance Criteria

- [ ] All 4 stories completed
- [ ] Events browsable and searchable
- [ ] Category filtering works
- [ ] Homepage attractive
- [ ] Mobile responsive
- [ ] Page load <2s
- [ ] SEO optimized

---

## Dependencies

### Search Index Setup
In `convex/schema.ts`, ensure search index is defined:
```typescript
.searchIndex("search_events", {
  searchField: "name",
  filterFields: ["status", "eventType"],
})
```

---

## Next Steps

➡️ **Technical Specifications** ([technical-specs.md](./technical-specs.md))

Complete database schema, API specifications, and technical implementation details.
