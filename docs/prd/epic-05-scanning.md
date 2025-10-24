# Epic 5: Event Entry & QR Scanning

**Priority:** P0 (Critical)
**Sprint:** Week 8
**Total Points:** 12
**Dependencies:** Epic 3 (Tickets with QR codes must exist)

---

## Epic Overview

Enable event organizers and staff to validate tickets at event entry using a mobile-friendly PWA scanner with QR code validation, manual lookup, and offline support.

### Goals
- Fast ticket validation (<1 second)
- Mobile-first scanner interface
- Offline functionality with sync
- Prevent duplicate entries
- Manual lookup fallback

### Success Criteria
- [ ] Scanner works on mobile devices
- [ ] QR validation success rate >98%
- [ ] Duplicate scan prevention works
- [ ] Offline mode functional
- [ ] Manual lookup available
- [ ] Scan history logged

---

## Story 5.1: Scanner PWA Setup

**Priority:** P0 | **Effort:** 3 points

### Acceptance Criteria
- [ ] Scanner accessible as PWA at `/scan/[eventId]`
- [ ] Installable on mobile devices
- [ ] Works offline (basic mode)
- [ ] Camera permissions requested
- [ ] Only organizer can scan their event tickets
- [ ] Clean, mobile-optimized UI

### Technical Implementation

**PWA Configuration:** `next.config.ts`
```typescript
const nextConfig = {
  // ... other config
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
  },
};
```

**Manifest:** `public/manifest.json`
```json
{
  "name": "SteppersLife Scanner",
  "short_name": "SL Scanner",
  "description": "Scan tickets for SteppersLife events",
  "start_url": "/scan",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/scanner-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/scanner-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Component:** `app/(scanner)/scan/[eventId]/page.tsx`
```typescript
"use client";

export default function ScannerPage({ params }: { params: { eventId: string } }) {
  const event = useQuery(api.events.queries.getEvent, { eventId: params.eventId as any });
  const canScan = useQuery(api.scanning.queries.canScanEvent, { eventId: params.eventId as any });

  if (!canScan) {
    return (
      <div className="p-6 text-center">
        <p>You don't have permission to scan for this event.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-black text-white p-4">
        <h1 className="font-bold">{event?.name}</h1>
        <p className="text-sm text-gray-400">Scanner Mode</p>
      </header>

      <QRScanner eventId={params.eventId} />
    </div>
  );
}
```

---

## Story 5.2: QR Code Scanning

**Priority:** P0 | **Effort:** 5 points

### Acceptance Criteria
- [ ] Camera activates when scanner loads
- [ ] QR code detected automatically
- [ ] Ticket validated in real-time
- [ ] Success: Green screen + checkmark + beep + attendee name
- [ ] Error: Red screen + X + error beep + error message
- [ ] Duplicate scan shows "Already scanned at [time]"
- [ ] Invalid QR shows "Invalid ticket"

### Technical Implementation

**Component:** `components/scanning/QRScanner.tsx`
```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Html5QrcodeScanner } from "html5-qrcode";
import { CheckCircle, XCircle } from "lucide-react";

export function QRScanner({ eventId }: { eventId: string }) {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<any>(null);
  const scanTicket = useMutation(api.scanning.mutations.scanTicket);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          const qrData = JSON.parse(decodedText);

          const scanResult = await scanTicket({
            eventId: eventId as any,
            ticketInstanceId: qrData.ticketId,
            timestamp: qrData.timestamp,
            signature: qrData.signature,
          });

          setResult(scanResult);

          // Play sound
          if (scanResult.valid) {
            playSuccessSound();
          } else {
            playErrorSound();
          }

          // Clear result after 3 seconds
          setTimeout(() => setResult(null), 3000);
        } catch (error) {
          setResult({ valid: false, message: "Invalid QR code" });
        }
      },
      (error) => {
        // Scanning error (can be ignored)
      }
    );

    return () => {
      scanner.clear();
    };
  }, [eventId, scanTicket]);

  return (
    <div className="flex-1 relative">
      <div id="qr-reader" className="w-full" />

      {result && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 ${
            result.valid ? "bg-green-500" : "bg-red-500"
          } bg-opacity-95`}
        >
          <div className="text-center text-white p-8">
            {result.valid ? (
              <>
                <CheckCircle className="w-32 h-32 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Valid Ticket</h2>
                <p className="text-xl">{result.attendeeName}</p>
                <p className="text-lg mt-2">{result.ticketType}</p>
              </>
            ) : (
              <>
                <XCircle className="w-32 h-32 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Invalid</h2>
                <p className="text-xl">{result.message}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function playSuccessSound() {
  const audio = new Audio("/sounds/success.mp3");
  audio.play();
}

function playErrorSound() {
  const audio = new Audio("/sounds/error.mp3");
  audio.play();
}
```

**Convex Mutation:** `convex/scanning/mutations.ts`
```typescript
export const scanTicket = mutation({
  args: {
    eventId: v.id("events"),
    ticketInstanceId: v.id("ticketInstances"),
    timestamp: v.number(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify HMAC signature
    const data = `${args.ticketInstanceId}:${args.timestamp}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.QR_CODE_SECRET_KEY!)
      .update(data)
      .digest("hex");

    if (args.signature !== expectedSignature) {
      return { valid: false, message: "Invalid QR code (signature mismatch)" };
    }

    // Get ticket instance
    const ticket = await ctx.db.get(args.ticketInstanceId);
    if (!ticket) {
      return { valid: false, message: "Ticket not found" };
    }

    // Check if already scanned
    if (ticket.status === "SCANNED") {
      return {
        valid: false,
        message: `Already scanned at ${new Date(ticket.scannedAt!).toLocaleTimeString()}`,
      };
    }

    // Check if for correct event
    if (ticket.eventId !== args.eventId) {
      return { valid: false, message: "Ticket is for a different event" };
    }

    // Mark as scanned
    await ctx.db.patch(args.ticketInstanceId, {
      status: "SCANNED",
      scannedAt: Date.now(),
      scannedBy: identity.subject as any,
    });

    // Log scan
    await ctx.db.insert("scans", {
      ticketInstanceId: args.ticketInstanceId,
      eventId: args.eventId,
      scannedBy: identity.subject as any,
      scanType: "QR_SCAN",
      valid: true,
      scannedAt: Date.now(),
    });

    // Get order details for attendee name
    const order = await ctx.db.get(ticket.orderId);

    return {
      valid: true,
      attendeeName: order?.buyerName || "Unknown",
      ticketType: ticket.ticketType || "General Admission",
    };
  },
});
```

---

## Story 5.3: Manual Ticket Lookup

**Priority:** P1 | **Effort:** 2 points

### Acceptance Criteria
- [ ] Search button opens manual lookup
- [ ] Search by: name, email, or ticket number
- [ ] Shows matching tickets
- [ ] Click result to manually check-in
- [ ] Manual check-in logged with reason
- [ ] Only available to organizer and assigned staff

### Technical Implementation

**Component:** `components/scanning/ManualLookup.tsx`
```typescript
"use client";

export function ManualLookup({ eventId }: { eventId: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchTickets = useQuery(api.scanning.queries.searchTickets, {
    eventId: eventId as any,
    query: searchQuery,
  });
  const manualCheckin = useMutation(api.scanning.mutations.manualCheckin);

  const handleCheckin = async (ticketId: string, reason: string) => {
    await manualCheckin({ ticketInstanceId: ticketId as any, reason });
  };

  return (
    <div className="p-4">
      <Input
        placeholder="Search by name, email, or ticket #"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="mt-4 space-y-2">
        {searchTickets?.map((ticket) => (
          <Card key={ticket._id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{ticket.buyerName}</p>
                <p className="text-sm text-gray-500">{ticket.ticketNumber}</p>
                <Badge>{ticket.status}</Badge>
              </div>

              {ticket.status === "VALID" && (
                <Button onClick={() => handleCheckin(ticket._id, "Manual lookup")}>
                  Check In
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## Story 5.4: Scan History

**Priority:** P2 | **Effort:** 2 points

### Acceptance Criteria
- [ ] Organizer views scan history at `/scan/[eventId]/history`
- [ ] Shows: attendee name, ticket #, scan time, scanned by
- [ ] Filter by date/time
- [ ] Export as CSV
- [ ] Real-time updates as scans happen

### Technical Implementation

**Component:** `app/(scanner)/scan/[eventId]/history/page.tsx`
```typescript
"use client";

export default function ScanHistoryPage({ params }: { params: { eventId: string } }) {
  const scans = useQuery(api.scanning.queries.getScanHistory, {
    eventId: params.eventId as any,
  });

  const exportCSV = () => {
    const csv = scans?.map((s) => ({
      Time: new Date(s.scannedAt).toLocaleString(),
      Attendee: s.attendeeName,
      Ticket: s.ticketNumber,
      Scanner: s.scannerName,
      Type: s.scanType,
    }));

    // Convert to CSV and download
    // ... CSV conversion logic
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Scan History</h1>
        <Button onClick={exportCSV}>Export CSV</Button>
      </div>

      <div className="space-y-2">
        {scans?.map((scan) => (
          <Card key={scan._id} className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{scan.attendeeName}</p>
                <p className="text-sm text-gray-500">Ticket #{scan.ticketNumber}</p>
              </div>
              <div className="text-right text-sm">
                <p>{new Date(scan.scannedAt).toLocaleString()}</p>
                <p className="text-gray-500">{scan.scannerName}</p>
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

- [ ] All 4 stories completed
- [ ] Scanner works on iOS and Android
- [ ] QR validation >98% success rate
- [ ] Duplicate prevention works
- [ ] Manual lookup functional
- [ ] Scan history logged
- [ ] Offline mode working
- [ ] PWA installable

---

## Dependencies

### NPM Packages
```bash
npm install html5-qrcode
```

### Audio Files
- `/public/sounds/success.mp3` - Success beep
- `/public/sounds/error.mp3` - Error beep

### Environment
- `QR_CODE_SECRET_KEY` - For HMAC verification

---

## Next Epic

➡️ **Epic 6: Search & Discovery** ([epic-06-discovery.md](./epic-06-discovery.md))
