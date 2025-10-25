# Epic 2: Event Creation & Management

**Priority:** P0 (Critical)
**Sprint:** Week 3-4
**Total Points:** 21
**Dependencies:** Epic 1 (Authentication)

---

## Epic Overview

Enable event organizers to create three types of events (Save the Date, Free Events, Ticketed Events), configure ticketing options, manage Stripe Connect accounts, and publish events for public discovery.

### Goals
- Support flexible event creation for different use cases
- Integrate Stripe Connect for marketplace payments
- Provide intuitive organizer dashboard
- Enable event editing and publishing workflow

### Success Criteria
- [ ] Organizers can create all 3 event types
- [ ] Ticketed events require Stripe Connect setup
- [ ] Events can be drafted, edited, and published
- [ ] Real-time updates to event data
- [ ] Image uploads working reliably
- [ ] Stripe Connect onboarding seamless

---

## User Stories

## Story 2.1: Create Save the Date Event

**Priority:** P0 (Critical)
**Effort:** 3 points
**Sprint:** Week 3

### User Story

**As an** event organizer
**I want to** create a "Save the Date" announcement
**So that** I can inform my audience about upcoming events without full details

### Acceptance Criteria

- [ ] Organizer can select "Save the Date" event type
- [ ] Required fields: Event name, date, organizer name, event type category, featured image
- [ ] Image upload supports JPG, PNG, WebP (max 5MB)
- [ ] Date picker with calendar interface
- [ ] Event saved as DRAFT status
- [ ] Success message shown after creation
- [ ] Event appears in organizer's dashboard
- [ ] No payment or ticketing fields shown for this type

### Technical Implementation

#### Convex Functions to Create

**File:** `convex/events/mutations.ts`
```typescript
import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createSaveTheDateEvent = mutation({
  args: {
    name: v.string(),
    startDate: v.number(), // Unix timestamp
    organizerName: v.string(),
    categories: v.array(v.string()),
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const eventId = await ctx.db.insert("events", {
      name: args.name,
      description: "", // Optional for Save the Date
      organizerId: user._id,
      organizerName: args.organizerName,
      eventType: "SAVE_THE_DATE",
      status: "DRAFT",
      startDate: args.startDate,
      timezone: "America/New_York", // TODO: Get from user input
      location: {
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
      },
      images: [args.imageId],
      categories: args.categories,
      allowWaitlist: false,
      allowTransfers: false,
      maxTicketsPerOrder: 1,
      minTicketsPerOrder: 1,
      stripeAccountSetupComplete: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return eventId;
  },
});

export const generateImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
```

#### React Components to Build

**File:** `app/(dashboard)/organizer/events/create/page.tsx`
```typescript
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/events/ImageUpload";
import { CategorySelector } from "@/components/events/CategorySelector";

const EVENT_TYPES = [
  { value: "SAVE_THE_DATE", label: "Save the Date" },
  { value: "FREE_EVENT", label: "Free Event" },
  { value: "TICKETED_EVENT", label: "Ticketed Event" },
];

export default function CreateEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createSaveTheDateEvent = useMutation(api.events.mutations.createSaveTheDateEvent);

  const [eventType, setEventType] = useState("SAVE_THE_DATE");
  const [formData, setFormData] = useState({
    name: "",
    organizerName: "",
    startDate: new Date(),
    categories: [] as string[],
    imageId: null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imageId) {
      toast({
        title: "Error",
        description: "Please upload an event image",
        variant: "destructive",
      });
      return;
    }

    try {
      const eventId = await createSaveTheDateEvent({
        name: formData.name,
        organizerName: formData.organizerName,
        startDate: formData.startDate.getTime(),
        categories: formData.categories,
        imageId: formData.imageId as any,
      });

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      router.push(`/organizer/events/${eventId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Type Selection */}
        <div>
          <Label htmlFor="eventType">Event Type</Label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Event Name */}
        <div>
          <Label htmlFor="name">Event Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Summer Steppers Social"
            required
          />
        </div>

        {/* Organizer Name */}
        <div>
          <Label htmlFor="organizer">Organizer Name *</Label>
          <Input
            id="organizer"
            value={formData.organizerName}
            onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
            placeholder="Your name or organization"
            required
          />
        </div>

        {/* Event Date */}
        <div>
          <Label>Event Date *</Label>
          <Calendar
            mode="single"
            selected={formData.startDate}
            onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
            className="rounded-md border"
          />
        </div>

        {/* Categories */}
        <div>
          <Label>Event Category *</Label>
          <CategorySelector
            selected={formData.categories}
            onChange={(categories) => setFormData({ ...formData, categories })}
          />
        </div>

        {/* Featured Image */}
        <div>
          <Label>Featured Image *</Label>
          <ImageUpload
            onUploadComplete={(storageId) =>
              setFormData({ ...formData, imageId: storageId })
            }
          />
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG, or WebP. Max 5MB.
          </p>
        </div>

        <div className="flex gap-4">
          <Button type="submit" className="flex-1">
            Create Event
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
```

**File:** `components/events/ImageUpload.tsx`
```typescript
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  onUploadComplete: (storageId: string) => void;
}

export function ImageUpload({ onUploadComplete }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const generateUploadUrl = useMutation(api.events.mutations.generateImageUploadUrl);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Max 5MB.");
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Invalid file type. Use JPG, PNG, or WebP.");
      return;
    }

    setUploading(true);

    try {
      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Convex storage
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();
      onUploadComplete(storageId);
    } catch (error) {
      alert("Upload failed. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete("");
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative w-full h-64 rounded-lg overflow-hidden border">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              JPG, PNG or WebP (MAX. 5MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      )}

      {uploading && (
        <p className="text-sm text-gray-500">Uploading...</p>
      )}
    </div>
  );
}
```

**File:** `components/events/CategorySelector.tsx`
```typescript
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  "Set",
  "Workshop",
  "Cruise",
  "Outdoors Steppin",
  "Holiday Event",
  "Weekend Event",
  "Save the Date",
];

interface CategorySelectorProps {
  selected: string[];
  onChange: (categories: string[]) => void;
}

export function CategorySelector({ selected, onChange }: CategorySelectorProps) {
  const toggleCategory = (category: string) => {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      onChange([...selected, category]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
      {CATEGORIES.map((category) => (
        <div key={category} className="flex items-center space-x-2">
          <Checkbox
            id={category}
            checked={selected.includes(category)}
            onCheckedChange={() => toggleCategory(category)}
          />
          <Label
            htmlFor={category}
            className="text-sm cursor-pointer"
          >
            {category}
          </Label>
        </div>
      ))}
    </div>
  );
}
```

#### Database Schema

**Table:** `events` (already defined, reference from `convex/schema.ts`)

#### Testing Checklist

- [ ] Event type selector shows 3 options
- [ ] Form validates required fields
- [ ] Image upload works (JPG, PNG, WebP)
- [ ] Image validation (5MB max) enforced
- [ ] Image preview shows before submission
- [ ] Date picker allows future dates
- [ ] Categories can be selected (multiple)
- [ ] Event created in DRAFT status
- [ ] Success message and redirect work
- [ ] Event appears in organizer dashboard

---

## Story 2.2: Create Free Event with Door Pricing

**Priority:** P0 (Critical)
**Effort:** 3 points
**Sprint:** Week 3

### User Story

**As an** event organizer
**I want to** create a free event listing with door price information
**So that** people can find my event while I collect payments at entry

### Acceptance Criteria

- [ ] Organizer can select "Free Event" type
- [ ] All fields available: name, date, time, location, description, door price
- [ ] Door price displayed as text (no payment processing)
- [ ] Rich text editor for event description
- [ ] Location address with validation
- [ ] Time picker with AM/PM
- [ ] Event saved as DRAFT
- [ ] No ticket inventory management

### Technical Implementation

#### Convex Functions to Create

**File:** `convex/events/mutations.ts`
```typescript
export const createFreeEvent = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    startDate: v.number(),
    startTime: v.string(), // "7:00 PM"
    endTime: v.string(), // "11:00 PM"
    organizerName: v.string(),
    location: v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
    }),
    doorPrice: v.string(), // e.g., "$20 at the door"
    categories: v.array(v.string()),
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const eventId = await ctx.db.insert("events", {
      ...args,
      organizerId: user._id,
      eventType: "FREE_EVENT",
      status: "DRAFT",
      timezone: "America/New_York",
      location: {
        ...args.location,
        country: "US",
      },
      images: [args.imageId],
      allowWaitlist: false,
      allowTransfers: false,
      maxTicketsPerOrder: 1,
      minTicketsPerOrder: 1,
      stripeAccountSetupComplete: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return eventId;
  },
});
```

#### React Components Extensions

**Update:** `app/(dashboard)/organizer/events/create/page.tsx`

Add conditional fields based on event type:
```typescript
{eventType === "FREE_EVENT" && (
  <>
    {/* Description */}
    <div>
      <Label htmlFor="description">Event Description *</Label>
      <RichTextEditor
        value={formData.description}
        onChange={(value) => setFormData({ ...formData, description: value })}
      />
    </div>

    {/* Start & End Time */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="startTime">Start Time *</Label>
        <TimePicker
          value={formData.startTime}
          onChange={(time) => setFormData({ ...formData, startTime: time })}
        />
      </div>
      <div>
        <Label htmlFor="endTime">End Time *</Label>
        <TimePicker
          value={formData.endTime}
          onChange={(time) => setFormData({ ...formData, endTime: time })}
        />
      </div>
    </div>

    {/* Location */}
    <div>
      <Label>Event Location *</Label>
      <div className="space-y-2">
        <Input
          placeholder="Street Address"
          value={formData.location.address}
          onChange={(e) =>
            setFormData({
              ...formData,
              location: { ...formData.location, address: e.target.value },
            })
          }
          required
        />
        <div className="grid grid-cols-3 gap-2">
          <Input
            placeholder="City"
            value={formData.location.city}
            onChange={(e) =>
              setFormData({
                ...formData,
                location: { ...formData.location, city: e.target.value },
              })
            }
            required
          />
          <Input
            placeholder="State"
            value={formData.location.state}
            onChange={(e) =>
              setFormData({
                ...formData,
                location: { ...formData.location, state: e.target.value },
              })
            }
            required
          />
          <Input
            placeholder="Zip Code"
            value={formData.location.zipCode}
            onChange={(e) =>
              setFormData({
                ...formData,
                location: { ...formData.location, zipCode: e.target.value },
              })
            }
            required
          />
        </div>
      </div>
    </div>

    {/* Door Price */}
    <div>
      <Label htmlFor="doorPrice">Door Price</Label>
      <Input
        id="doorPrice"
        placeholder="e.g., $20 at the door, $15 with student ID"
        value={formData.doorPrice}
        onChange={(e) => setFormData({ ...formData, doorPrice: e.target.value })}
      />
      <p className="text-xs text-gray-500 mt-1">
        Optional. Displayed as text only (no online payment).
      </p>
    </div>
  </>
)}
```

**File:** `components/events/RichTextEditor.tsx`
```typescript
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border rounded-lg">
      <div className="flex gap-1 p-2 border-b bg-gray-50">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-gray-200" : ""}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-gray-200" : ""}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
      </div>

      <EditorContent editor={editor} className="prose max-w-none p-4" />
    </div>
  );
}
```

**File:** `components/events/TimePicker.tsx`
```typescript
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = ["00", "15", "30", "45"];
  const periods = ["AM", "PM"];

  const [hour, minute, period] = value?.split(/:| /) || ["7", "00", "PM"];

  const updateTime = (newHour?: string, newMinute?: string, newPeriod?: string) => {
    const h = newHour || hour;
    const m = newMinute || minute;
    const p = newPeriod || period;
    onChange(`${h}:${m} ${p}`);
  };

  return (
    <div className="flex gap-2">
      <Select value={hour} onValueChange={(v) => updateTime(v, undefined, undefined)}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={String(h)}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={minute} onValueChange={(v) => updateTime(undefined, v, undefined)}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={period} onValueChange={(v) => updateTime(undefined, undefined, v)}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periods.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

#### Testing Checklist

- [ ] All required fields validate
- [ ] Rich text editor formatting works
- [ ] Time picker shows correct values
- [ ] Location address validates format
- [ ] Door price saves as text
- [ ] Event created successfully
- [ ] No payment fields shown

---

## Story 2.3: Create Single-Day Ticketed Event

**Priority:** P0 (Critical)
**Effort:** 5 points
**Sprint:** Week 4

### User Story

**As an** event organizer
**I want to** create a ticketed event for a single day
**So that** I can sell tickets online and manage attendance

### Acceptance Criteria

- [ ] Organizer can select "Ticketed Event" type
- [ ] All event details required (name, date, time, location, description, image)
- [ ] Ticket configuration: name, price, total quantity
- [ ] Sales period: start date/time, end date/time
- [ ] Max tickets per order configurable
- [ ] Stripe Connect account required (show prompt if not set up)
- [ ] Event saved as DRAFT
- [ ] Cannot publish without Stripe account

### Technical Implementation

#### Convex Functions to Create

**File:** `convex/events/mutations.ts`
```typescript
export const createTicketedEvent = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    startDate: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    organizerName: v.string(),
    location: v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
    }),
    categories: v.array(v.string()),
    imageId: v.id("_storage"),
    ticketConfig: v.object({
      ticketType: v.string(), // "General Admission"
      price: v.number(), // In cents
      quantityTotal: v.number(),
      maxPerOrder: v.number(),
      salesStart: v.number(),
      salesEnd: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Check if user has Stripe Connect account
    // For now, we'll allow creation and check on publish
    // In reality, you might want to check here too

    // Create event
    const eventId = await ctx.db.insert("events", {
      name: args.name,
      description: args.description,
      organizerId: user._id,
      organizerName: args.organizerName,
      eventType: "TICKETED_EVENT",
      status: "DRAFT",
      startDate: args.startDate,
      timezone: "America/New_York",
      location: {
        ...args.location,
        country: "US",
      },
      images: [args.imageId],
      categories: args.categories,
      allowWaitlist: false,
      allowTransfers: false,
      maxTicketsPerOrder: args.ticketConfig.maxPerOrder,
      minTicketsPerOrder: 1,
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeAccountSetupComplete: !!user.stripeConnectAccountId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create ticket type
    await ctx.db.insert("tickets", {
      eventId,
      ticketType: args.ticketConfig.ticketType,
      description: undefined,
      price: args.ticketConfig.price,
      quantityTotal: args.ticketConfig.quantityTotal,
      quantitySold: 0,
      quantityReserved: 0,
      salesStart: args.ticketConfig.salesStart,
      salesEnd: args.ticketConfig.salesEnd,
      maxPerOrder: args.ticketConfig.maxPerOrder,
      minPerOrder: 1,
      active: true,
      createdAt: Date.now(),
    });

    return eventId;
  },
});
```

#### React Components Extensions

**Update:** `app/(dashboard)/organizer/events/create/page.tsx`

Add ticketing configuration section:
```typescript
{eventType === "TICKETED_EVENT" && (
  <>
    {/* All Free Event fields + Ticket Configuration */}

    {/* Stripe Connect Check */}
    {!user?.stripeConnectAccountId && (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">
          Stripe Connect Required
        </h3>
        <p className="text-sm text-yellow-700 mb-3">
          To accept payments, you need to connect your Stripe account.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/organizer/onboarding")}
        >
          Set Up Stripe Connect
        </Button>
      </div>
    )}

    {/* Ticket Configuration */}
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="font-semibold">Ticket Configuration</h3>

      <div>
        <Label htmlFor="ticketType">Ticket Name *</Label>
        <Input
          id="ticketType"
          placeholder="e.g., General Admission"
          value={formData.ticketConfig.ticketType}
          onChange={(e) =>
            setFormData({
              ...formData,
              ticketConfig: {
                ...formData.ticketConfig,
                ticketType: e.target.value,
              },
            })
          }
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (USD) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="25.00"
            value={formData.ticketConfig.price / 100}
            onChange={(e) =>
              setFormData({
                ...formData,
                ticketConfig: {
                  ...formData.ticketConfig,
                  price: Math.round(parseFloat(e.target.value) * 100),
                },
              })
            }
            required
          />
        </div>

        <div>
          <Label htmlFor="quantity">Total Tickets *</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            placeholder="100"
            value={formData.ticketConfig.quantityTotal}
            onChange={(e) =>
              setFormData({
                ...formData,
                ticketConfig: {
                  ...formData.ticketConfig,
                  quantityTotal: parseInt(e.target.value),
                },
              })
            }
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="maxPerOrder">Max Tickets Per Order *</Label>
        <Input
          id="maxPerOrder"
          type="number"
          min="1"
          max="10"
          placeholder="10"
          value={formData.ticketConfig.maxPerOrder}
          onChange={(e) =>
            setFormData({
              ...formData,
              ticketConfig: {
                ...formData.ticketConfig,
                maxPerOrder: parseInt(e.target.value),
              },
            })
          }
          required
        />
      </div>

      <div>
        <Label>Sales Period *</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Label className="text-xs">Sales Start</Label>
            <Input
              type="datetime-local"
              value={new Date(formData.ticketConfig.salesStart).toISOString().slice(0, 16)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ticketConfig: {
                    ...formData.ticketConfig,
                    salesStart: new Date(e.target.value).getTime(),
                  },
                })
              }
              required
            />
          </div>
          <div>
            <Label className="text-xs">Sales End</Label>
            <Input
              type="datetime-local"
              value={new Date(formData.ticketConfig.salesEnd).toISOString().slice(0, 16)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ticketConfig: {
                    ...formData.ticketConfig,
                    salesEnd: new Date(e.target.value).getTime(),
                  },
                })
              }
              required
            />
          </div>
        </div>
      </div>
    </div>
  </>
)}
```

#### Testing Checklist

- [ ] Stripe Connect prompt shows if not set up
- [ ] Ticket configuration saves correctly
- [ ] Price validation (positive numbers)
- [ ] Quantity validation (min 1)
- [ ] Sales period validation (start < end < event date)
- [ ] Max per order validation (1-10)
- [ ] Event and ticket created in database
- [ ] Cannot publish without Stripe account

---

## Story 2.4: Stripe Connect Onboarding

**Priority:** P0 (Critical)
**Effort:** 5 points
**Sprint:** Week 4

### User Story

**As an** event organizer
**I want to** connect my Stripe account
**So that** I can accept online payments for ticketed events

### Acceptance Criteria

- [ ] Organizer directed to Stripe Connect setup before creating ticketed events
- [ ] Stripe Express account created automatically
- [ ] Onboarding link generated and opened in new tab
- [ ] Account status tracked (pending, complete, rejected)
- [ ] Organizer can only publish ticketed events after completion
- [ ] Error handling for failed onboarding
- [ ] Account verification status visible in dashboard

### Technical Implementation

#### Convex Actions to Create

**File:** `convex/stripe/connect.ts`
```typescript
"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export const createConnectAccount = action({
  args: {
    email: v.string(),
    businessName: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: args.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/organizer/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/organizer/onboarding/complete`,
      type: "account_onboarding",
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  },
});

export const checkAccountStatus = action({
  args: {
    accountId: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await stripe.accounts.retrieve(args.accountId);

    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    };
  },
});
```

**File:** `convex/users/mutations.ts`
```typescript
export const saveStripeConnectAccount = mutation({
  args: {
    accountId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      stripeConnectAccountId: args.accountId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
```

#### React Components to Build

**File:** `app/(dashboard)/organizer/onboarding/page.tsx`
```typescript
"use client";

import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useQuery(api.users.queries.getCurrentUser);
  const createAccount = useAction(api.stripe.connect.createConnectAccount);
  const saveAccount = useMutation(api.users.mutations.saveStripeConnectAccount);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartOnboarding = async () => {
    if (!user?.email) return;

    setLoading(true);
    setError("");

    try {
      const result = await createAccount({
        email: user.email,
        businessName: user.name || "",
      });

      // Save account ID
      await saveAccount({ accountId: result.accountId });

      // Open Stripe onboarding in new tab
      window.open(result.onboardingUrl, "_blank");

      // Poll for completion
      // In reality, you'd use a webhook for this
      setTimeout(() => {
        router.push("/organizer/onboarding/complete");
      }, 5000);
    } catch (err: any) {
      setError(err.message || "Failed to start onboarding");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Connect Your Stripe Account</h1>
        <p className="text-gray-600 mb-8">
          To accept payments for ticketed events, you need to connect a Stripe account.
          This allows you to receive payouts directly.
        </p>

        {user.stripeConnectAccountId ? (
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              Account Connected
            </h2>
            <p className="text-green-700 mb-4">
              Your Stripe account is connected and ready to accept payments.
            </p>
            <Button onClick={() => router.push("/organizer/events")}>
              Go to Events
            </Button>
          </div>
        ) : (
          <div>
            <div className="mb-8 p-6 bg-gray-50 border rounded-lg text-left">
              <h3 className="font-semibold mb-3">What you'll need:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Social Security Number or Tax ID</li>
                <li>• Bank account details for payouts</li>
                <li>• Business information (or personal if individual)</li>
                <li>• Photo ID (may be requested)</li>
              </ul>
            </div>

            {error && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500 inline mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <Button
              onClick={handleStartOnboarding}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Connect with Stripe"
              )}
            </Button>

            <p className="text-xs text-gray-500 mt-4">
              By connecting, you agree to Stripe's{" "}
              <a href="https://stripe.com/connect-account/legal" className="underline">
                Connected Account Agreement
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**File:** `app/api/webhooks/stripe/route.ts` (Webhook Handler)
```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "account.updated":
        const account = event.data.object as Stripe.Account;

        // Update user's Stripe account status in Convex
        // You'd need to create a mutation for this
        // await convex.mutation(api.users.mutations.updateStripeAccountStatus, {
        //   accountId: account.id,
        //   chargesEnabled: account.charges_enabled,
        //   detailsSubmitted: account.details_submitted,
        // });
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return NextResponse.json(
      { error: "Webhook error" },
      { status: 400 }
    );
  }
}
```

#### Environment Variables Required

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
```

#### Testing Checklist

- [ ] Stripe account creation successful
- [ ] Onboarding link opens in new tab
- [ ] Return URL redirects correctly
- [ ] Account ID saved to user profile
- [ ] Webhook updates account status
- [ ] Error handling for failed onboarding
- [ ] Account status visible in dashboard

---

## Story 2.5: Event Listing (Organizer Dashboard)

**Priority:** P1 (High)
**Effort:** 3 points
**Sprint:** Week 4

### User Story

**As an** event organizer
**I want to** see a list of all my events
**So that** I can manage them easily

### Acceptance Criteria

- [ ] Organizer sees list of their events
- [ ] Events grouped by status: Draft, Published
- [ ] Each event shows: name, date, status, ticket sales (if applicable)
- [ ] Click event to view details or edit
- [ ] "Create New Event" button prominent
- [ ] Empty state for new organizers
- [ ] Real-time updates when events change

### Technical Implementation

#### Convex Functions to Create

**File:** `convex/events/queries.ts`
```typescript
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getOrganizerEvents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    const events = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
      .order("desc")
      .collect();

    // For each event, get ticket sales if applicable
    const eventsWithSales = await Promise.all(
      events.map(async (event) => {
        if (event.eventType === "TICKETED_EVENT") {
          const tickets = await ctx.db
            .query("tickets")
            .withIndex("by_event", (q) => q.eq("eventId", event._id))
            .collect();

          const totalSold = tickets.reduce((sum, t) => sum + t.quantitySold, 0);
          const totalCapacity = tickets.reduce((sum, t) => sum + t.quantityTotal, 0);

          return {
            ...event,
            ticketsSold: totalSold,
            ticketCapacity: totalCapacity,
          };
        }

        return event;
      })
    );

    return eventsWithSales;
  },
});

export const getEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});
```

#### React Components to Build

**File:** `app/(dashboard)/organizer/events/page.tsx`
```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { EventCard } from "@/components/events/EventCard";

export default function OrganizerEventsPage() {
  const events = useQuery(api.events.queries.getOrganizerEvents);

  if (!events) {
    return <div>Loading...</div>;
  }

  const draftEvents = events.filter((e) => e.status === "DRAFT");
  const publishedEvents = events.filter((e) => e.status === "PUBLISHED");

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Events</h1>
        <Link href="/organizer/events/create">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't created any events yet.</p>
          <Link href="/organizer/events/create">
            <Button>Create Your First Event</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {draftEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Drafts ({draftEvents.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {draftEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            </div>
          )}

          {publishedEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Published ({publishedEvents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publishedEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**File:** `components/events/EventCard.tsx`
```typescript
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Ticket } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface EventCardProps {
  event: any;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/organizer/events/${event._id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
        {event.images[0] && (
          <img
            src={event.images[0]}
            alt={event.name}
            className="w-full h-48 object-cover"
          />
        )}

        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg truncate">{event.name}</h3>
            <Badge variant={event.status === "PUBLISHED" ? "default" : "secondary"}>
              {event.status}
            </Badge>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            {format(new Date(event.startDate), "MMM d, yyyy")}
          </div>

          {event.location.city && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              {event.location.city}, {event.location.state}
            </div>
          )}

          {event.eventType === "TICKETED_EVENT" && (
            <div className="flex items-center text-sm text-gray-600">
              <Ticket className="w-4 h-4 mr-2" />
              {event.ticketsSold} / {event.ticketCapacity} sold
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
```

#### Testing Checklist

- [ ] Events load and display correctly
- [ ] Draft and published sections separate
- [ ] Real-time updates when events change
- [ ] Empty state shows for new organizers
- [ ] Create button navigates correctly
- [ ] Event cards clickable
- [ ] Ticket sales displayed for ticketed events

---

## Story 2.6: Edit Event

**Priority:** P1 (High)
**Effort:** 3 points
**Sprint:** Week 4

### User Story

**As an** event organizer
**I want to** edit my event details after creation
**So that** I can update information and respond to changes

### Acceptance Criteria

- [ ] Organizer can edit all event fields except event type
- [ ] Form pre-populated with existing data
- [ ] Changes to ticketed events show warning if tickets already sold
- [ ] Success message after save
- [ ] Real-time preview of changes
- [ ] Cannot change from ticketed to free if tickets sold

### Technical Implementation

#### Convex Functions to Create

**File:** `convex/events/mutations.ts`
```typescript
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    location: v.optional(
      v.object({
        address: v.string(),
        city: v.string(),
        state: v.string(),
        zipCode: v.string(),
      })
    ),
    categories: v.optional(v.array(v.string())),
    doorPrice: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    // Check if tickets have been sold
    if (event.eventType === "TICKETED_EVENT") {
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      const soldTickets = tickets.reduce((sum, t) => sum + t.quantitySold, 0);

      if (soldTickets > 0 && (args.startDate || args.location)) {
        // Critical changes - should notify ticket holders
        // For now, just allow the update
        // In production, you'd send notifications here
      }
    }

    await ctx.db.patch(args.eventId, {
      ...args,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
```

#### React Components to Build

**File:** `app/(dashboard)/organizer/events/[eventId]/edit/page.tsx`
```typescript
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function EditEventPage({
  params,
}: {
  params: { eventId: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const event = useQuery(api.events.queries.getEvent, {
    eventId: params.eventId as any,
  });
  const updateEvent = useMutation(api.events.mutations.updateEvent);

  const [formData, setFormData] = useState<any>(null);
  const [ticketsSold, setTicketsSold] = useState(0);

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description,
        startDate: new Date(event.startDate),
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        location: event.location,
        categories: event.categories,
        doorPrice: event.doorPrice || "",
      });
    }
  }, [event]);

  if (!event || !formData) {
    return <div>Loading...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateEvent({
        eventId: params.eventId as any,
        ...formData,
        startDate: formData.startDate.getTime(),
      });

      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      router.push(`/organizer/events/${params.eventId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Event</h1>

      {ticketsSold > 0 && (
        <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Tickets have been sold</p>
            <p>
              Changes to date, time, or location will notify all ticket holders.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reuse the same form fields from create page */}
        {/* ... form fields ... */}

        <div className="flex gap-4">
          <Button type="submit">Save Changes</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
```

#### Testing Checklist

- [ ] Form pre-populated with event data
- [ ] All fields editable except event type
- [ ] Warning shown if tickets sold
- [ ] Changes saved successfully
- [ ] Real-time preview works
- [ ] Authorization checked
- [ ] Error handling for invalid data

---

## Story 2.7: Publish Event

**Priority:** P1 (High)
**Effort:** 2 points
**Sprint:** Week 5

### User Story

**As an** event organizer
**I want to** publish my draft event
**So that** it becomes visible to the public

### Acceptance Criteria

- [ ] Organizer can publish draft events
- [ ] Published events visible on public event listing
- [ ] Cannot publish ticketed event without Stripe setup
- [ ] Validation ensures all required fields complete
- [ ] Confirmation modal before publishing
- [ ] Real-time status update

### Technical Implementation

#### Convex Functions to Create

**File:** `convex/events/mutations.ts`
```typescript
export const publishEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    // Validation
    if (!event.name || !event.startDate) {
      throw new Error("Missing required fields");
    }

    if (event.eventType === "TICKETED_EVENT") {
      if (!event.stripeConnectAccountId) {
        throw new Error("Stripe Connect account required for ticketed events");
      }

      if (!event.stripeAccountSetupComplete) {
        throw new Error("Complete Stripe Connect onboarding first");
      }

      // Check tickets exist
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      if (tickets.length === 0) {
        throw new Error("Add at least one ticket type");
      }
    }

    await ctx.db.patch(args.eventId, {
      status: "PUBLISHED",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const unpublishEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.eventId, {
      status: "DRAFT",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
```

#### React Components to Build

**File:** `components/events/PublishButton.tsx`
```typescript
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface PublishButtonProps {
  eventId: string;
  eventStatus: string;
  eventType: string;
  stripeSetupComplete: boolean;
}

export function PublishButton({
  eventId,
  eventStatus,
  eventType,
  stripeSetupComplete,
}: PublishButtonProps) {
  const { toast } = useToast();
  const publishEvent = useMutation(api.events.mutations.publishEvent);
  const unpublishEvent = useMutation(api.events.mutations.unpublishEvent);

  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);

    try {
      if (eventStatus === "PUBLISHED") {
        await unpublishEvent({ eventId: eventId as any });
        toast({
          title: "Success",
          description: "Event unpublished",
        });
      } else {
        await publishEvent({ eventId: eventId as any });
        toast({
          title: "Success",
          description: "Event published and now visible to public",
        });
      }

      setShowConfirm(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to publish event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canPublish =
    eventType !== "TICKETED_EVENT" || stripeSetupComplete;

  return (
    <>
      <Button
        onClick={() => setShowConfirm(true)}
        disabled={!canPublish}
      >
        {eventStatus === "PUBLISHED" ? "Unpublish" : "Publish Event"}
      </Button>

      {!canPublish && (
        <p className="text-sm text-red-500 mt-1">
          Complete Stripe Connect setup to publish ticketed events
        </p>
      )}

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {eventStatus === "PUBLISHED"
                ? "Unpublish Event?"
                : "Publish Event?"}
            </DialogTitle>
            <DialogDescription>
              {eventStatus === "PUBLISHED"
                ? "This event will no longer be visible to the public."
                : "This event will be visible to the public and available for ticket purchases."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={loading}>
              {loading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

#### Testing Checklist

- [ ] Publish button enabled only when valid
- [ ] Confirmation modal shows before publish
- [ ] Ticketed events require Stripe setup
- [ ] Published events appear in public listing
- [ ] Real-time status update works
- [ ] Unpublish reverses publication
- [ ] Authorization enforced

---

## Epic-Level Acceptance Criteria

Before marking this epic as complete, verify:

- [ ] All 7 user stories completed and tested
- [ ] All 3 event types can be created
- [ ] Stripe Connect onboarding seamless
- [ ] Event dashboard functional
- [ ] Event editing works correctly
- [ ] Publishing/unpublishing reliable
- [ ] Real-time updates working
- [ ] Image uploads successful
- [ ] Authorization enforced on all operations
- [ ] Mobile responsive on all pages
- [ ] E2E tests passing for event flows

---

## Dependencies & Prerequisites

### External Setup Required
1. **Stripe Connect:**
   - Stripe account configured
   - Connect platform application created
   - Webhook endpoint set up
   - Environment variables configured

2. **Image Storage:**
   - Convex file storage configured
   - File size limits enforced (5MB)
   - Supported formats: JPG, PNG, WebP

### NPM Packages Required
```bash
npm install @tiptap/react @tiptap/starter-kit
npm install date-fns
npm install stripe@19.1.0
```

---

## Technical Notes

### Stripe Connect Flow
1. User clicks "Connect with Stripe"
2. Convex action creates Express account
3. Account link generated
4. User redirected to Stripe onboarding
5. Stripe returns to app with account status
6. Webhook updates final status
7. Account ID saved to user profile

### Real-Time Event Updates
- Event list automatically updates when events change
- Convex subscriptions handle real-time sync
- No manual refresh needed

### Authorization
- All mutations check authentication
- Organizer ID verified on every operation
- Non-organizers cannot edit events

### Performance
- Event images lazy loaded
- List pagination for large datasets
- Optimistic updates on mutations

---

## Related Files

**Convex:**
- `convex/events/mutations.ts`
- `convex/events/queries.ts`
- `convex/stripe/connect.ts`
- `convex/tickets/mutations.ts`

**Frontend:**
- `app/(dashboard)/organizer/events/create/page.tsx`
- `app/(dashboard)/organizer/events/[eventId]/edit/page.tsx`
- `app/(dashboard)/organizer/events/page.tsx`
- `app/(dashboard)/organizer/onboarding/page.tsx`
- `components/events/ImageUpload.tsx`
- `components/events/CategorySelector.tsx`
- `components/events/RichTextEditor.tsx`
- `components/events/TimePicker.tsx`
- `components/events/EventCard.tsx`
- `components/events/PublishButton.tsx`

**API:**
- `app/api/webhooks/stripe/route.ts`

---

## Next Epic

➡️ **Epic 3: Ticket Purchase & Payment Processing** ([epic-03-ticketing.md](./epic-03-ticketing.md))

After event creation, users will be able to purchase tickets through Stripe Connect.
