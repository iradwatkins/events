# Manual Testing Guide - Events SteppersLife
**Complete Cleanup Done!** ✅ Database is now clean (0 events)

---

## 🎯 Testing Objective

Test the complete event lifecycle while creating professional demo events:
1. Sign in
2. Create 3 professional events
3. Publish all events
4. Verify they appear on homepage
5. Test My Events & My Tickets pages

**Estimated Time:** 20-30 minutes

---

## ✅ Step 1: Sign In

### **Option A: Test Credentials (Email/Password)**
1. Go to: https://events.stepperslife.com/login
2. Use test account:
   - Email: `bobbygwatkins@gmail.com`
   - Password: `pass`
3. Click "Sign In"

### **Option B: Google OAuth**
1. Go to: https://events.stepperslife.com/login
2. Click "Continue with Google"
3. Sign in with your Google account

**Expected Result:**
- ✅ Redirected to homepage
- ✅ Your name/email shows in header
- ✅ "Create" button visible

---

## 🎨 Step 2: Create Professional Demo Events

### **Event 1: Chicago Summer Steppers Set 2025**

1. Click **"Create"** button (top right)
2. Fill out the 4-step form:

**Step 1 - Basic Information:**
- **Event Name:** `Chicago Summer Steppers Set 2025`
- **Event Type:** Select "Ticketed Event"
- **Description:**
```
Join us for an electrifying night of Chicago Stepping! Featuring live DJ, professional dancers, and an unforgettable atmosphere.

Whether you're a seasoned stepper or just learning, this event welcomes all skill levels. Dress code: Upscale casual.

Come ready to dance the night away! Early bird tickets available.
```
- **Categories:** Select "Steppers Set" and "Social"

**Step 2 - Date & Time:**
- **Start Date:** July 15, 2025 at 8:00 PM
- **End Date:** July 16, 2025 at 2:00 AM
- **Timezone:** Auto-detected (America/Chicago)

**Step 3 - Location:**
- **Venue Name:** `Grand Ballroom at Navy Pier`
- **Street Address:** `600 E Grand Ave`
- **City:** `Chicago`
- **State:** `IL`
- **ZIP Code:** `60611`

**Step 4 - Additional Details:**
- **Event Capacity:** `500`
- **Image:** Skip for now (or upload if you have one)

3. Click **"Create Event"**

**Expected Result:**
- ✅ Redirected to event dashboard
- ✅ Event status shows "DRAFT" (yellow badge)
- ✅ Green "Publish Event" button visible

4. **Click "Publish Event"** → Confirm
5. **Expected Result:** Status changes to "PUBLISHED" (green badge)

---

### **Event 2: Beginner Stepping Workshop - Atlanta**

1. Click **"Create"** again (from homepage or My Events)
2. Fill out the form:

**Step 1:**
- **Event Name:** `Beginner Stepping Workshop - Atlanta`
- **Event Type:** "Ticketed Event"
- **Description:**
```
Perfect for beginners! Learn the fundamentals of Chicago Stepping in this comprehensive 3-hour workshop.

Our experienced instructors will teach you:
• Basic steps and footwork
• Turns and spins
• Partner connection and leading/following

No dance experience required! Light refreshments provided. Bring a partner or come solo - we'll pair you up!
```
- **Categories:** "Workshop" and "Educational"

**Step 2:**
- **Start Date:** June 20, 2025 at 2:00 PM
- **End Date:** June 20, 2025 at 5:00 PM

**Step 3:**
- **Venue Name:** `Atlanta Dance Studio`
- **Address:** `234 Peachtree St NE`
- **City:** `Atlanta`
- **State:** `GA`
- **ZIP Code:** `30303`

**Step 4:**
- **Capacity:** `50`

3. Create → Then **Publish**

---

### **Event 3: Detroit Steppers Festival 2025**

1. Click **"Create"** once more
2. Fill out:

**Step 1:**
- **Event Name:** `Detroit Steppers Festival 2025`
- **Event Type:** "Ticketed Event"
- **Description:**
```
The Midwest's premier stepping festival returns!

Three days of non-stop stepping featuring:
• National stepping competitions
• Daily workshops with championship dancers
• Vendor marketplace
• Nightly sets with top DJs
• Special performances

VIP packages available including meet & greets with celebrity steppers. Hotel discounts for out-of-town guests.

This is THE stepping event of the summer - don't miss it!
```
- **Categories:** "Festival", "Competition", and "Social"

**Step 2:**
- **Start Date:** August 8, 2025 at 6:00 PM
- **End Date:** August 10, 2025 at 11:00 PM

**Step 3:**
- **Venue Name:** `Detroit Marriott Renaissance Center`
- **Address:** `400 Renaissance Center`
- **City:** `Detroit`
- **State:** `MI`
- **ZIP Code:** `48243`

**Step 4:**
- **Capacity:** `1000`

3. Create → Then **Publish**

---

## 🧪 Step 3: Verify Events on Homepage

1. Go to: https://events.stepperslife.com
2. **Expected Result:**
   - ✅ All 3 events visible on homepage
   - ✅ Event cards show images (or placeholder if no image uploaded)
   - ✅ Event names, dates, locations visible
   - ✅ Can click on events to view details

---

## 📋 Step 4: Test My Events Page

1. Click your profile icon → "My Events"
   - OR go to: `/organizer/events`

2. **Expected Result:**
   - ✅ All 3 events listed
   - ✅ Each shows "PUBLISHED" status (green badge)
   - ✅ Can click on each event to view dashboard
   - ✅ Dashboard shows:
     - Overview tab (stats)
     - Orders tab (empty for now)
     - Attendees tab (empty for now)
   - ✅ "Edit Event" button visible
   - ✅ "Share" button works
   - ✅ "View Public Page" opens event detail

---

## 🎟️ Step 5: Test My Tickets Page

1. Click profile icon → "My Tickets"
   - OR go to: `/my-tickets`

2. **Expected Result:**
   - ✅ Page loads (no login error!)
   - ✅ Shows "No Tickets Yet" message
   - ✅ Shows your email in header
   - ✅ "Browse Events" button visible

**Note:** Since you haven't purchased tickets yet, this should be empty.

---

## ✅ Success Criteria

Mark each as complete:

- [ ] **Signed in successfully** (Google or test credentials)
- [ ] **Created Event 1** (Chicago Summer Steppers Set)
- [ ] **Created Event 2** (Beginner Workshop)
- [ ] **Created Event 3** (Detroit Festival)
- [ ] **Published all 3 events**
- [ ] **All events visible on homepage**
- [ ] **My Events page shows all 3 events**
- [ ] **My Tickets page loads without error**
- [ ] **Can view event dashboards**
- [ ] **Can edit events**

---

## 🐛 If You Encounter Issues

### **Issue: "Please sign in" when already logged in**
- **Fix:** Refresh the page (Ctrl+R or Cmd+R)
- **If persists:** Sign out and sign back in

### **Issue: Event not appearing on homepage**
- **Check:** Is status "PUBLISHED"? (not DRAFT)
- **Fix:** Go to event dashboard → Click "Publish Event"

### **Issue: "Field required" when creating event**
- **Check:** Start Date & Time filled? (needs BOTH date AND time)
- **Check:** City and State filled?

### **Issue: Can't upload image**
- **Workaround:** Skip image upload for now
- **Note:** Images can be added later via Edit Event

---

## 📊 After Testing - Report Back

Once you've completed all steps, please note:

1. **What worked?** ✅
2. **What didn't work?** ❌
3. **Any errors encountered?**
4. **Overall experience rating?** (1-10)

---

## 🎯 What This Tests

✅ **User Authentication** - Sign in flow
✅ **User Sync** - Auto-creates user in database
✅ **Event Creation** - Full 4-step form
✅ **Event Publishing** - DRAFT → PUBLISHED workflow
✅ **Event Display** - Homepage rendering
✅ **Image Handling** - Placeholders or uploaded images
✅ **My Events Page** - Organizer dashboard
✅ **My Tickets Page** - Customer view
✅ **Navigation** - All page links
✅ **Data Persistence** - Events saved correctly

---

## 🚀 What's Next

After testing, we can:
1. **Add ticket tiers** to events
2. **Set up payment processing**
3. **Add real event images**
4. **Build affiliate dashboard**
5. **Build door scanner UI**
6. **Test ticket purchasing flow**

---

**Happy Testing!** 🎉

**Questions or Issues?** Report them and I'll fix immediately.

**Site:** https://events.stepperslife.com
**Database:** Clean and ready (0 events currently)
**Status:** Ready for testing!
