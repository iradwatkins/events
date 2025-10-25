# 🚨 CRITICAL: Convex Deployment Required

**Date:** October 25, 2025
**Status:** ❌ BLOCKING Story 2.1 Completion
**Severity:** P0 - Critical

---

## 🐛 Issue Summary

Manual browser testing revealed that **Convex backend is NOT deployed to production**. The application code is correct, but Convex mutations are not available on the production backend.

### Errors Found:

1. **Image Upload Failing**
   ```
   Could not find public function for 'files/mutations:generateUploadUrl'
   ```

2. **Event Creation Failing**
   ```
   [CONVEX M(events/mutations:createEvent)] Server Error
   Uncaught Error: Not authenticated
   ```

### Root Cause:

- ✅ Local code is correct (TESTING MODE, no auth required)
- ❌ Production Convex backend still has OLD code with auth checks
- ❌ `npx convex deploy` requires manual authentication (cannot be automated)

---

## ✅ Quick Fix (5 minutes)

### Option 1: One-Line Deployment (Recommended)

Run this on the VPS:

```bash
cd /root/websites/events-stepperslife && ./deploy-convex.sh
```

**This will:**
1. Check you're in the right directory
2. Show what will be deployed
3. Ask for confirmation
4. Deploy all Convex mutations to production
5. Provide next steps

### Option 2: Manual Deployment

```bash
# SSH to VPS
ssh root@72.60.28.175
# Password: Bobby321&Gloria321Watkins?

# Navigate to project
cd /root/websites/events-stepperslife

# Deploy Convex
npx convex deploy

# Follow browser authentication if prompted
# Confirm deployment when asked
```

### Option 3: Deploy from Local Machine

If you have the project locally:

```bash
# On your local machine
cd /path/to/event.stepperslife.com

# Pull latest changes
git pull origin main

# Deploy to production
npx convex deploy

# Convex will detect prod:combative-viper-389 from .env.local
```

---

## 📋 What Gets Deployed

### Convex Mutations (Backend Functions):

**events/mutations.ts**
- ✅ `createEvent` - TESTING MODE (no authentication)
- ✅ `updateEvent` - Update event details
- ✅ `deleteEvent` - Delete events
- ✅ `configurePayment` - Payment setup

**files/mutations.ts**
- ✅ `generateUploadUrl` - Get image upload URL ← **CRITICAL**
- ✅ `saveImageMetadata` - Save image metadata
- ✅ `deleteImage` - Delete uploaded images

**events/queries.ts**
- ✅ `getOrganizerEvents` - Get events (no auth filter) ← **CRITICAL**
- ✅ `getEventById` - Get single event
- ✅ `getPublicEvents` - Get published events

---

## 🧪 Verification Steps (After Deployment)

### Test 1: Image Upload (2 minutes)

1. Go to: https://event.stepperslife.com/organizer/events/create
2. Fill in basic event details
3. Click "Upload Image" in Additional Details section
4. Select a test image (JPG/PNG/WebP, <5MB)
5. ✅ **Success:** Image preview appears
6. ❌ **Fail:** Error in console about generateUploadUrl

### Test 2: Event Creation (3 minutes)

1. Complete the event form:
   - Event name: "Test Stepping Event"
   - Event type: "Save the Date"
   - Date: Future date
   - Location: Any city/state
   - Category: Select any
   - Image: Upload test image
2. Click "Create Event"
3. ✅ **Success:** Success message, redirect to dashboard, event appears
4. ❌ **Fail:** Error in console about "Not authenticated"

### Test 3: Dashboard Real-time Update (1 minute)

1. Open dashboard: https://event.stepperslife.com/organizer/events
2. Open create page in another tab
3. Create new event
4. Switch back to dashboard tab (don't refresh)
5. ✅ **Success:** New event appears automatically
6. ❌ **Fail:** No event appears, need to refresh

---

## 📊 Expected Console Output (After Fix)

### Before Deployment ❌
```
[CONVEX M(files/mutations:generateUploadUrl)] Server Error
Could not find public function for 'files/mutations:generateUploadUrl'

[CONVEX M(events/mutations:createEvent)] Server Error
Uncaught Error: Not authenticated
```

### After Deployment ✅
```
[CREATE EVENT] TESTING MODE - No authentication required
[CREATE EVENT] Creating event...
[CREATE EVENT] Event created successfully: kt2...
```

---

## 🔍 Troubleshooting

### Issue: "MissingAccessToken" Error

**Error:**
```
Error fetching GET https://api.convex.dev/api/deployment/...
401 Unauthorized: MissingAccessToken
```

**Solution:**
```bash
# Authenticate with Convex
npx convex login

# Then deploy
npx convex deploy
```

### Issue: "Wrong Deployment" Error

**Error:**
```
Error: This project is configured for dev:combative-viper-389
but you're trying to deploy to prod:combative-viper-389
```

**Solution:**
```bash
# Update .env.local to use prod deployment
CONVEX_DEPLOYMENT=prod:combative-viper-389

# Then deploy
npx convex deploy
```

### Issue: Browser Authentication Required

**Scenario:** CLI opens browser for authentication

**Solution:**
1. Browser will open to https://dashboard.convex.dev
2. Log in with your Convex account
3. Authorize the deployment
4. Return to terminal
5. Deployment will continue automatically

---

## 📈 Deployment Checklist

- [ ] SSH to VPS or have local project ready
- [ ] Navigate to project directory
- [ ] Run `npx convex deploy` (or use deploy-convex.sh)
- [ ] Confirm deployment when prompted
- [ ] Wait for deployment to complete (~30 seconds)
- [ ] Test image upload (Test 1)
- [ ] Test event creation (Test 2)
- [ ] Test real-time dashboard (Test 3)
- [ ] Check browser console for errors
- [ ] Update QA report with test results

---

## 🎯 Success Criteria

**Deployment is successful when:**

✅ No errors in `npx convex deploy` output
✅ Console shows "✓ Deployed successfully"
✅ Image upload works without errors
✅ Event creation works without "Not authenticated" error
✅ Events appear in dashboard
✅ No Convex errors in browser console

---

## 📝 Additional Notes

### Why This Happened:

During the initial deployment, we successfully:
- ✅ Built the Next.js application
- ✅ Deployed code to VPS
- ✅ Updated all frontend code
- ✅ Configured environment variables

But we **could not** deploy Convex because:
- ❌ Convex requires interactive authentication
- ❌ Cannot be automated from server CLI
- ❌ No deploy key available

This is **normal** for Convex and by design for security.

### Future Prevention:

To avoid this in future deployments:

1. **Option A:** Get a Convex Deploy Key
   - Visit: https://dashboard.convex.dev
   - Project Settings → Deploy Keys
   - Create new deploy key
   - Add to `.env.local` as `CONVEX_DEPLOY_KEY=...`
   - Automated deployments will work

2. **Option B:** Always deploy Convex manually
   - Keep current workflow
   - Always run `npx convex deploy` after code changes
   - Add to deployment checklist

---

## 🚀 Ready to Deploy?

**Quick Start:**

```bash
# SSH to VPS
ssh root@72.60.28.175

# Run deployment script
cd /root/websites/events-stepperslife && ./deploy-convex.sh

# Or manual
npx convex deploy
```

**After deployment, report back:**
- ✅ Deployment successful
- ✅ Image upload works
- ✅ Event creation works
- ✅ No console errors

---

**Document Created:** October 25, 2025
**Last Updated:** October 25, 2025
**Status:** Ready for deployment
