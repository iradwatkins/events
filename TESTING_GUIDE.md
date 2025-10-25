# Event Creation Testing Guide

## Summary of Fixes

I've fixed the two main issues:

### ✅ Issue #1: Missing Publish Button
- **Added green "Publish Event" button** to event dashboard (`/organizer/events/[eventId]`)
- Button only shows when event status is DRAFT
- Clicking it changes status from DRAFT → PUBLISHED
- Event then appears on homepage

### ✅ Issue #2: Better Validation Messages
- Form now shows EXACTLY which fields are missing
- Example: "Please fill in the following required fields: • Start Date & Time • City"

### ✅ Issue #3: Added Test Login
- Added email/password login for easy testing
- Test credentials are now available (see below)

---

## How to Test Event Creation

### Step 1: Sign In

Go to: **https://events.stepperslife.com/login**

**Test Credentials:**
- Email: `bobbygwatkins@gmail.com` | Password: `pass`
- Email: `ira@irawatkins.com` | Password: `pass`

### Step 2: Create an Event

1. Click **"Create"** button (top right)
2. Fill out all 4 steps:

**Step 1 - Basic Information:**
- Event Name: "Test Steppers Set 2025"
- Event Type: Select "Ticketed Event"
- Description: "This is a test event"
- Categories: Click "Steppers Set"

**Step 2 - Date & Time:**
- **Start Date & Time:** MUST fill BOTH date AND time!
  - Click calendar icon → select future date
  - Click clock icon → select time
  - Should look like: `2025-01-30T19:00`

**Step 3 - Location:**
- Venue Name: "Test Venue" (optional)
- Street Address: "123 Main St" (optional)
- **City:** "Chicago" (REQUIRED)
- **State:** "IL" (REQUIRED)
- ZIP Code: "60601" (optional)

**Step 4 - Additional Details:**
- Capacity: "300" (optional)
- Image: Skip for now (optional)

3. Click **"Create Event"**

### Step 3: Publish the Event

After creating:
1. You'll be redirected to `/organizer/events/[eventId]/payment-setup`
2. Go to your event dashboard: `/organizer/events/[eventId]`
3. Look for the **green "Publish Event" button** (top right area)
4. Click it and confirm
5. Alert will show: "Event published successfully!"

### Step 4: Verify on Homepage

1. Go to homepage: **https://events.stepperslife.com**
2. Your event should now appear in the event grid!

---

## Common Issues & Solutions

### "Please fill in the following required fields: • Start Date & Time"

**Problem:** The datetime-local input requires BOTH date AND time

**Solution:**
- Make sure the Start Date field shows something like `2025-01-30T19:00`
- Both the date part (2025-01-30) and time part (T19:00) must be present
- If it's empty or only shows date, click the field and set both

### "Event created but not visible on homepage"

**Problem:** Event is still in DRAFT status

**Solution:**
1. Go to `/organizer/events` (My Events page)
2. Click on your event
3. Look for status badge showing "DRAFT" (yellow badge)
4. Click the green **"Publish Event"** button
5. Confirm the action
6. Event status changes to "PUBLISHED" (green badge)
7. Now it appears on homepage

### "I see a yellow DRAFT badge but no Publish button"

**Problem:** Page needs to be refreshed or button is not visible

**Solution:**
- Refresh the page (Ctrl+R or Cmd+R)
- Look for the green button next to "Share" and "Edit Event" buttons
- Make sure you're on the event dashboard page (not the public event page)

---

## What Was Fixed

### File: `app/organizer/events/create/page.tsx`
```javascript
// Before:
if (!eventName || !description || !startDate || !city || !state) {
  alert("Please fill in all required fields");  // ❌ Not helpful!
}

// After:
const missingFields = [];
if (!eventName) missingFields.push("Event Name");
if (!description) missingFields.push("Description");
if (!startDate) missingFields.push("Start Date & Time");
if (!city) missingFields.push("City");
if (!state) missingFields.push("State");

if (missingFields.length > 0) {
  alert(`Please fill in the following required fields:\n\n${missingFields.map(f => `• ${f}`).join('\n')}`);
  // ✅ Now shows exactly what's missing!
}
```

### File: `app/organizer/events/[eventId]/page.tsx`
```javascript
// Added:
const publishEvent = useMutation(api.events.mutations.publishEvent);

const handlePublish = async () => {
  await publishEvent({ eventId });
  alert("Event published successfully!");
};

// UI:
{event.status === "DRAFT" && (
  <button onClick={handlePublish} className="bg-green-600...">
    Publish Event
  </button>
)}
```

### File: `auth.config.ts` & `app/login/page.tsx`
- Added Credentials provider for testing
- Added email/password form to login page
- Test credentials: bobbygwatkins@gmail.com / pass, ira@irawatkins.com / pass

---

## Testing Checklist

- [ ] Can sign in with test credentials
- [ ] Can create event (all 4 steps)
- [ ] Get helpful error if field is missing
- [ ] Event is created successfully
- [ ] Can see event in "My Events" page
- [ ] Event shows DRAFT status (yellow badge)
- [ ] Can see green "Publish Event" button
- [ ] Can click publish button
- [ ] Event status changes to PUBLISHED (green badge)
- [ ] Event appears on homepage
- [ ] Can click on event and see details

---

## App Status

✅ Application running on port 3004
✅ All changes deployed
✅ PM2 config saved
✅ Test login enabled

**Test the app at:** https://events.stepperslife.com
