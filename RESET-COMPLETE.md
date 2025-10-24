# events.stepperslife.com - Reset Complete ✅

## Reset Date
October 24, 2025

## Overview
Successfully reset events.stepperslife.com to a fresh Next.js 16.0 installation with Stripe integration (replacing Square), ready for new development.

---

## What Was Completed

### 1. Backup & Cleanup
- ✅ Stopped PM2 process
- ✅ Backed up old installation to: `/root/websites/events-stepperslife.backup-20251024`
- ✅ Additional backup exists: `/root/websites/events-stepperslife.backup-20251020-113042`

### 2. Fresh Installation
- ✅ Created new Next.js 16.0 project with TypeScript
- ✅ Installed Stripe SDK (`stripe`, `@stripe/stripe-js`)
- ✅ Installed Convex (`convex`, `@convex-dev/auth`)
- ✅ Installed UI dependencies (Radix UI, Tailwind CSS v4)
- ✅ Configured for port 3004

### 3. Convex Backend
- ✅ Connected to existing deployment: `expert-vulture-775`
- ✅ Created basic schema with Stripe fields:
  - `users` table with `stripeCustomerId` and `stripeConnectedAccountId`
  - `events` table with organizer relationship
- ✅ Convex provider integrated in app

### 4. Stripe Integration
- ✅ Webhook endpoint created: `/api/stripe/webhook`
- ✅ Configured for split payments architecture
- ✅ Environment variables prepared (need actual keys)
- ✅ Ready for Stripe Connect setup

### 5. Configuration Preserved
- ✅ Google OAuth credentials (from backup)
- ✅ Better Auth configuration
- ✅ Convex deployment settings
- ✅ Nginx reverse proxy (port 3004)
- ✅ SSL certificate active

### 6. Deployment
- ✅ Production build successful
- ✅ PM2 process running (ID: 4)
- ✅ HTTPS accessible: https://events.stepperslife.com
- ✅ HTTP 200 status confirmed

---

## Current Status

### Live URLs
- **Production**: https://events.stepperslife.com
- **Local**: http://localhost:3004

### PM2 Process
```
id: 4
name: events-stepperslife
status: online
mode: cluster
uptime: Running
```

### Tech Stack
- Next.js: 16.0.0 (latest)
- React: 19.2.0
- TypeScript: 5.x
- Tailwind CSS: v4
- Convex: 1.28.0
- Stripe: 19.1.0
- @stripe/stripe-js: 8.1.0

---

## Next Steps Required

### 1. Stripe Configuration (URGENT)
Update `.env.local` with your Stripe credentials:

```bash
# Replace these placeholder values
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_CONNECT_CLIENT_ID=ca_YOUR_CONNECT_ID_HERE
```

**Steps:**
1. Login to Stripe Dashboard
2. Enable Stripe Connect for platform payments
3. Copy API keys to `.env.local`
4. Configure webhook: `https://events.stepperslife.com/api/stripe/webhook`
5. Restart app: `pm2 restart events-stepperslife`

### 2. Convex Database
The Convex deployment is connected but needs data:

**Option A - Keep Old Data:**
- Access Convex dashboard: https://dashboard.convex.dev
- Project: expert-vulture-775
- Review existing data tables
- Decide what to keep

**Option B - Clear and Start Fresh:**
- Go to Convex dashboard
- Delete all records from tables
- Schema is already set up for Stripe

### 3. Start Development

**Local Development:**
```bash
cd /root/websites/events-stepperslife
npm run dev
# Runs on http://localhost:3004
```

**Key Directories:**
- `/app` - Pages and API routes
- `/components` - Reusable React components
- `/convex` - Backend functions and schema
- `/lib` - Utility functions

### 4. Stripe Connect Setup

For split payments, you'll need to:
1. Create platform account in Stripe
2. Enable Stripe Connect
3. Set application fee percentage (suggested: 10%)
4. Implement connected account onboarding flow
5. Test payment splitting

### 5. Authentication
Google OAuth is configured but needs:
- Verify redirect URIs in Google Console
- Test sign-in flow
- Implement user session handling
- Add role-based access (admin/organizer/user)

---

## File Structure

```
events-stepperslife/
├── app/
│   ├── layout.tsx          # Root layout with Convex provider
│   ├── page.tsx             # Landing page (under development)
│   ├── globals.css          # Tailwind styles
│   └── api/
│       └── stripe/
│           └── webhook/
│               └── route.ts # Stripe webhook handler
├── components/
│   └── convex-client-provider.tsx
├── convex/
│   ├── schema.ts            # Database schema
│   ├── convex.config.ts     # Convex configuration
│   ├── auth.ts              # Auth configuration
│   └── http.ts              # HTTP routes
├── lib/
│   └── utils.ts             # Utility functions
├── .env.local               # Environment variables
├── package.json             # Dependencies
├── ecosystem.config.js      # PM2 configuration
└── next.config.ts           # Next.js configuration
```

---

## Environment Variables

Current `.env.local` configuration:

### ✅ Working
- `NEXT_PUBLIC_CONVEX_URL` - Connected
- `CONVEX_DEPLOYMENT` - Active
- `CONVEX_DEPLOY_KEY` - Valid
- `BETTER_AUTH_SECRET` - Set
- `BETTER_AUTH_URL` - Configured
- `GOOGLE_CLIENT_ID` - Configured
- `GOOGLE_CLIENT_SECRET` - Configured

### ⚠️ Needs Configuration
- `STRIPE_SECRET_KEY` - Placeholder (add real key)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Placeholder
- `STRIPE_WEBHOOK_SECRET` - Placeholder
- `STRIPE_CONNECT_CLIENT_ID` - Placeholder

---

## Stripe Split Payment Architecture

The platform is designed for automatic payment splitting:

```
Customer Purchase ($100)
         ↓
   Platform Receives
         ↓
    Automatic Split:
    ├── Event Organizer: $90 (90%)
    └── Platform Fee: $10 (10%)
```

**Implementation:**
- Use Stripe Connect Express accounts for organizers
- Platform collects payment
- Automatic transfers to connected accounts
- Platform retains application fee

---

## Backups

### Available Backups
1. **Most Recent**: `/root/websites/events-stepperslife.backup-20251024`
   - Contains old Square integration
   - Full Convex backend setup
   - All workflows and automation

2. **Previous**: `/root/websites/events-stepperslife.backup-20251020-113042`
   - Earlier state backup

### Restore if Needed
```bash
# Stop current app
pm2 stop events-stepperslife

# Restore from backup
cd /root/websites
mv events-stepperslife events-stepperslife.failed
mv events-stepperslife.backup-20251024 events-stepperslife

# Restart
pm2 restart events-stepperslife
```

---

## Docker Volumes (Preserved)

These volumes still exist from previous setup:
- `events-stepperslife_events_minio_data`
- `events-stepperslife_events_postgres_data`
- `events-stepperslife_events_redis_data`

**Note:** Current setup uses Convex (cloud), not local databases.
These volumes can be removed if not needed.

---

## Development Workflow

### Make Changes
```bash
# Edit files
nano app/page.tsx

# Test locally
npm run dev
```

### Deploy Changes
```bash
# Build production
npm run build

# Restart PM2
pm2 restart events-stepperslife

# Check logs
pm2 logs events-stepperslife
```

### Monitor
```bash
# Check status
pm2 status

# View logs
pm2 logs events-stepperslife

# Monitor resources
pm2 monit
```

---

## Important Notes

1. **Convex Data**: The backend is connected but you should review what data exists in the Convex dashboard

2. **Stripe Keys**: The app will run but payment features won't work until you add real Stripe keys

3. **Google OAuth**: Configured but needs testing - verify redirect URIs match

4. **Port 3004**: Reserved for events.stepperslife.com - don't change

5. **PM2 Auto-restart**: Enabled - app will restart if it crashes

6. **SSL Certificate**: Active via nginx reverse proxy

---

## Support & Documentation

- **Next.js Docs**: https://nextjs.org/docs
- **Stripe Docs**: https://stripe.com/docs
- **Convex Docs**: https://docs.convex.dev
- **Stripe Connect**: https://stripe.com/docs/connect

---

## Summary

✅ **Fresh Next.js 16.0 installation**
✅ **Stripe integration ready**
✅ **Convex backend connected**
✅ **Live at https://events.stepperslife.com**
✅ **PM2 process running**
✅ **Google OAuth configured**
⚠️ **Needs: Stripe API keys**
⚠️ **Needs: Data review in Convex**

**Ready for development!** 🚀
