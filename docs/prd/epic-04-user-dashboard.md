# Epic 4: User Ticket Management

**Priority:** P1 (High)
**Sprint:** Week 7
**Total Points:** 7
**Dependencies:** Epic 3 (Users must be able to purchase tickets)

---

## Epic Overview

Provide users with a dashboard to view purchased tickets, access QR codes, view order history, and resend ticket emails.

### Goals
- Easy access to all purchased tickets
- QR codes readily available on mobile
- Clear order history and receipts
- Self-service ticket management

### Success Criteria
- [ ] Users can view all upcoming and past tickets
- [ ] QR codes display correctly
- [ ] Tickets downloadable as PDF
- [ ] Email resend functionality works
- [ ] Mobile-optimized display

---

## Story 4.1: My Tickets Dashboard

**Priority:** P1 | **Effort:** 3 points

### Acceptance Criteria
- [ ] User dashboard at `/dashboard/tickets`
- [ ] Tickets grouped: Upcoming, Past
- [ ] Each ticket shows: event name, date, QR preview, order#
- [ ] Click ticket to view full details
- [ ] Real-time updates
- [ ] Empty state for no tickets

### Technical Implementation

**Convex Query:** `convex/users/queries.ts`
```typescript
export const getUserTickets = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("paymentStatus"), "COMPLETED"))
      .collect();

    const ticketsWithDetails = await Promise.all(
      orders.map(async (order) => {
        const event = await ctx.db.get(order.eventId);
        const ticketInstances = await ctx.db
          .query("ticketInstances")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        return {
          order,
          event,
          tickets: ticketInstances,
        };
      })
    );

    return ticketsWithDetails;
  },
});
```

**Component:** `app/(dashboard)/dashboard/tickets/page.tsx`
```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TicketCard } from "@/components/tickets/TicketCard";

export default function MyTicketsPage() {
  const ticketsData = useQuery(api.users.queries.getUserTickets);

  if (!ticketsData) return <div>Loading...</div>;

  const upcoming = ticketsData.filter((t) => t.event.startDate > Date.now());
  const past = ticketsData.filter((t) => t.event.startDate <= Date.now());

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Tickets</h1>

      <div className="space-y-8">
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Upcoming ({upcoming.length})</h2>
            <div className="space-y-4">
              {upcoming.map((data) => (
                <TicketCard key={data.order._id} data={data} />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Past ({past.length})</h2>
            <div className="space-y-4">
              {past.map((data) => (
                <TicketCard key={data.order._id} data={data} />
              ))}
            </div>
          </section>
        )}

        {ticketsData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven't purchased any tickets yet.</p>
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Story 4.2: Ticket Detail View

**Priority:** P1 | **Effort:** 2 points

### Acceptance Criteria
- [ ] Full ticket details page at `/dashboard/tickets/[ticketId]`
- [ ] Large QR code display
- [ ] Event information complete
- [ ] Download QR as PNG button
- [ ] Resend email button
- [ ] Order number and purchase date
- [ ] Ticket status (Valid, Scanned, Cancelled)

### Technical Implementation

**Component:** `app/(dashboard)/dashboard/tickets/[ticketId]/page.tsx`
```typescript
"use client";

export default function TicketDetailPage({ params }: { params: { ticketId: string } }) {
  const ticket = useQuery(api.tickets.queries.getTicketInstance, {
    ticketId: params.ticketId as any,
  });

  const resendEmail = useMutation(api.email.mutations.resendTicketEmail);

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = ticket.qrCode;
    link.download = `ticket-${ticket.ticketNumber}.png`;
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{ticket.eventName}</h1>

      <div className="border rounded-lg p-6 space-y-6">
        {/* QR Code */}
        <div className="text-center">
          <img
            src={ticket.qrCode}
            alt="Ticket QR Code"
            className="mx-auto w-64 h-64"
          />
          <p className="text-sm text-gray-500 mt-2">Ticket #{ticket.ticketNumber}</p>
        </div>

        {/* Event Info */}
        <div className="border-t pt-4 space-y-2">
          <div>
            <p className="text-sm text-gray-500">Event</p>
            <p className="font-semibold">{ticket.eventName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date & Time</p>
            <p>{format(new Date(ticket.eventDate), "MMMM d, yyyy 'at' h:mm a")}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p>{ticket.eventLocation}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <Badge variant={ticket.status === "SCANNED" ? "secondary" : "default"}>
              {ticket.status}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
            Download QR Code
          </Button>
          <Button
            onClick={() => resendEmail({ ticketId: ticket._id })}
            variant="outline"
            className="flex-1"
          >
            Resend Email
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Story 4.3: Order History

**Priority:** P2 | **Effort:** 2 points

### Acceptance Criteria
- [ ] Order history page at `/dashboard/orders`
- [ ] Each order shows: event, date, quantity, total, status
- [ ] Click order to view tickets
- [ ] Filter by status (Completed, Pending, Cancelled)
- [ ] Export orders as CSV

### Technical Implementation

**Component:** `app/(dashboard)/dashboard/orders/page.tsx`
```typescript
"use client";

export default function OrderHistoryPage() {
  const orders = useQuery(api.orders.queries.getUserOrders);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Order History</h1>

      <div className="space-y-4">
        {orders?.map((order) => (
          <Card key={order._id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{order.eventName}</h3>
                <p className="text-sm text-gray-500">
                  Order #{order.orderNumber} • {format(new Date(order.createdAt), "MMM d, yyyy")}
                </p>
                <p className="text-sm">
                  {order.quantity} ticket{order.quantity > 1 ? "s" : ""} • ${(order.totalAmount / 100).toFixed(2)}
                </p>
              </div>

              <div className="text-right">
                <Badge>{order.paymentStatus}</Badge>
                <Link href={`/dashboard/tickets?order=${order._id}`}>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Tickets
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## Epic-Level Acceptance Criteria

- [ ] All 3 stories completed
- [ ] Users can access all tickets
- [ ] QR codes display correctly on mobile
- [ ] Download and resend functions work
- [ ] Order history complete
- [ ] Real-time updates functional
- [ ] Mobile responsive

---

## Next Epic

➡️ **Epic 5: Event Entry & QR Scanning** ([epic-05-scanning.md](./epic-05-scanning.md))
