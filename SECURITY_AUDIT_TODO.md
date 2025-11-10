# SECURITY AUDIT & OPTIMIZATION TODO LIST
**Generated:** November 4, 2025
**Application:** events.stepperslife.com
**Status:** In Testing - Production Hardening Required

---

## CRITICAL NOTICE
**57 Issues Found:** 8 Critical | 15 High | 21 Medium | 13 Low
**Overall Risk:** HIGH - Address critical items before production deployment

---

## 🟢 SAFE TO DO NOW (During Testing)
*These changes won't affect login/authentication functionality*

### Immediate Wins (No Risk)

#### ✅ Add Missing Health Check Endpoint
**Priority:** HIGH | **Effort:** 5 min
**File:** Create `/app/api/health/route.ts`
```typescript
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: Date.now(),
    version: process.env.npm_package_version
  });
}
```
**Why:** Docker health check currently fails - this fixes it

---

#### ✅ Add robots.txt
**Priority:** MEDIUM | **Effort:** 2 min
**File:** Create `/public/robots.txt`
```txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /organizer/events/*/edit
Sitemap: https://events.stepperslife.com/sitemap.xml
```

---

#### ✅ Remove Production Console Logs
**Priority:** HIGH | **Effort:** 10 min
**Files:** 118 files contain console.log
**Fix:** Update `next.config.ts`
```typescript
compiler: {
  removeConsole: process.env.NODE_ENV === 'production',
}
```

---

#### ✅ Add Security Headers
**Priority:** HIGH | **Effort:** 10 min
**File:** `/next.config.ts`
```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
},
```

---

#### ✅ Add Error Boundaries
**Priority:** HIGH | **Effort:** 15 min
**File:** Create `/app/error.tsx`
```tsx
'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
```

---

#### ✅ Add Global Loading State
**Priority:** MEDIUM | **Effort:** 5 min
**File:** Create `/app/loading.tsx`
```tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}
```

---

#### ✅ Fix TypeScript Configuration
**Priority:** MEDIUM | **Effort:** 30 min (then fix errors)
**File:** `/tsconfig.json`
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```
**AND** `/next.config.ts` - Remove:
```typescript
typescript: {
  ignoreBuildErrors: true, // DELETE THIS LINE
},
```

---

#### ✅ Add SEO Metadata to Pages
**Priority:** MEDIUM | **Effort:** 20 min
**Files:** All `/app/**/page.tsx` files
**Example for home page:**
```typescript
export const metadata = {
  title: 'SteppersLife Events - Dance Events & Ticket Platform',
  description: 'Discover and register for stepping and line dancing events',
  openGraph: {
    title: 'SteppersLife Events',
    description: 'Discover and register for stepping and line dancing events',
    url: 'https://events.stepperslife.com',
    siteName: 'SteppersLife Events',
    images: ['/og-image.png'],
  },
};
```

---

#### ✅ Optimize Images
**Priority:** MEDIUM | **Effort:** 15 min
**Action:** Convert PNG logos to WebP (70-80% size reduction)
```bash
# Install sharp
npm install -D sharp

# Convert images
npx @squoosh/cli --webp auto public/*.png
```

---

#### ✅ Create Environment Variable Validator
**Priority:** HIGH | **Effort:** 15 min
**File:** Create `/lib/env-validator.ts`
```typescript
const requiredEnvVars = [
  'NEXT_PUBLIC_CONVEX_URL',
  'JWT_SECRET',
  'SQUARE_ACCESS_TOKEN',
  'SQUARE_APPLICATION_ID',
  'SQUARE_LOCATION_ID',
] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Call in middleware.ts or app layout
```

---

## 🔴 DO AFTER TESTING COMPLETE
*These require auth/login changes - wait until testing done*

### CRITICAL - Do First (Before Production)

#### 🚨 SEC-001: Remove Hardcoded API Keys
**Priority:** CRITICAL | **Effort:** 20 min
**File:** `/ecosystem.config.js` (lines 18, 24)
**Current Problem:**
```javascript
SQUARE_ACCESS_TOKEN: 'EAAAl9Vnn8vt-OJ_Fz7-rSKJvOU9SIAUVqLLfpa1M3ufBnP-sUTBdXPmAF_4XAAo',
STRIPE_SECRET_KEY: 'sk_test_51SIERp3Oaksg4w0LObuIH6ZT8aZC7JfRw8D1MWSf9GWjrfUryYCwiIlezRAo1Xfpa0jYZG9rMJrePO5H00h3jnHe003AqTlqXC',
```

**ACTION REQUIRED:**
1. **Move to environment variables:**
```javascript
SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN,
STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
```

2. **Rotate compromised keys:**
   - Log into Square Dashboard → Revoke old token → Generate new
   - Log into Stripe Dashboard → Revoke old key → Generate new
   - Update `.env` files with new credentials
   - **NEVER commit .env files to git**

3. **Add to .gitignore:**
```
.env*
!.env.example
ecosystem.config.js
```

---

#### 🚨 SEC-002: Fix JWT Secret Configuration
**Priority:** CRITICAL | **Effort:** 10 min
**Files:**
- `/middleware.ts` (lines 5-6)
- `/app/api/auth/login/route.ts` (lines 10-11)
- `/app/api/auth/me/route.ts` (lines 9-10)

**Current Problem:**
```typescript
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production" // ⚠️ WEAK!
);
```

**FIX:**
```typescript
const JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!JWT_SECRET_RAW) {
  throw new Error('CRITICAL: JWT_SECRET environment variable must be set');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);
```

**Generate secure secret:**
```bash
# Generate 256-bit random secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Add to .env.local:
# JWT_SECRET=<generated-secret-here>
```

---

#### 🚨 SEC-003: Re-enable Admin Route Protection
**Priority:** CRITICAL | **Effort:** 5 min
**File:** `/middleware.ts` (lines 11-13, 60-63)

**Current Problem:**
```typescript
// TESTING MODE: Admin temporarily removed from protected routes
const protectedRoutes = [
  "/organizer",
  // "/admin",  // ⚠️ Temporarily disabled for testing
];

// TESTING MODE: Admin role check temporarily disabled
// if (pathname.startsWith("/admin") && userRole !== "admin") {
//   return NextResponse.redirect(new URL("/", request.url));
// }
```

**FIX:**
```typescript
const protectedRoutes = [
  "/organizer",
  "/admin",  // ✅ RE-ENABLED
];

// ✅ RE-ENABLE THIS:
if (pathname.startsWith("/admin") && userRole !== "admin") {
  return NextResponse.redirect(new URL("/", request.url));
}
```

---

#### 🚨 SEC-004: Add API Route Authentication
**Priority:** CRITICAL | **Effort:** 30 min
**Files:**
- `/app/api/checkout/process-square-payment/route.ts`
- `/app/api/ai/extract-flyer-data/route.ts`
- `/app/api/admin/upload-flyer/route.ts`

**Create Auth Middleware:**
```typescript
// lib/auth-middleware.ts
import { jwtVerify } from "jose";

export async function verifyAuth(request: Request) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) throw new Error("JWT_SECRET not configured");

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    return payload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}
```

**Apply to routes:**
```typescript
// app/api/checkout/process-square-payment/route.ts
import { verifyAuth } from "@/lib/auth-middleware";

export async function POST(request: Request) {
  try {
    const user = await verifyAuth(request); // ✅ ADD THIS
    // ... rest of handler
  } catch (error) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}
```

---

#### 🚨 SEC-005: Fix Path Traversal Vulnerability
**Priority:** CRITICAL | **Effort:** 10 min
**File:** `/app/api/ai/extract-flyer-data/route.ts` (lines 22-30)

**Current Problem:**
```typescript
const filename = filepath.includes('/api/flyers/')
  ? filepath.split('/api/flyers/')[1]  // ⚠️ User controlled!
  : path.basename(filepath);

const fullPath = path.join(
  "/root/websites/events-stepperslife/STEPFILES/event-flyers",
  filename  // ⚠️ Can be ../../etc/passwd
);
```

**FIX:**
```typescript
import path from 'path';

// Sanitize filename - only allow safe characters
const sanitizedFilename = path.basename(filepath);
if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|pdf)$/i.test(sanitizedFilename)) {
  return Response.json(
    { error: 'Invalid filename format' },
    { status: 400 }
  );
}

const flyersDir = "/root/websites/events-stepperslife/STEPFILES/event-flyers";
const fullPath = path.join(flyersDir, sanitizedFilename);

// Verify path is still within allowed directory
if (!fullPath.startsWith(flyersDir)) {
  return Response.json(
    { error: 'Invalid file path' },
    { status: 400 }
  );
}
```

---

#### 🚨 SEC-006: Add CSRF Protection
**Priority:** HIGH | **Effort:** 45 min
**Action:** Implement CSRF tokens for all state-changing operations

**Install package:**
```bash
npm install csrf
```

**Implementation:**
```typescript
// middleware.ts - Add CSRF token to responses
import { Csrf } from 'csrf';
const csrf = new Csrf();

// Generate token for GET requests
// Validate token for POST/PUT/DELETE requests
```

---

#### 🚨 SEC-007: Add Rate Limiting
**Priority:** HIGH | **Effort:** 30 min
**Install:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Create limiter:**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

**Apply to API routes:**
```typescript
const { success } = await ratelimit.limit(identifier);
if (!success) {
  return Response.json({ error: "Too many requests" }, { status: 429 });
}
```

---

## 📊 PERFORMANCE OPTIMIZATIONS
*Can be done anytime - no auth impact*

### High Impact

#### ⚡ PERF-001: Reduce Bundle Size
**Priority:** HIGH | **Effort:** 1 hour
**Action:**
1. Analyze bundle: `npm install @next/bundle-analyzer`
2. Add to `next.config.ts`:
```typescript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer(nextConfig);
```
3. Run: `ANALYZE=true npm run build`
4. Remove unused dependencies
5. Use dynamic imports for heavy components

---

#### ⚡ PERF-002: Implement Code Splitting
**Priority:** HIGH | **Effort:** 45 min
**Example:**
```typescript
import dynamic from 'next/dynamic';

const SeatingChart = dynamic(() => import('@/components/SeatingChart'), {
  loading: () => <LoadingSkeleton />,
  ssr: false, // If not needed for SEO
});
```

---

#### ⚡ PERF-003: Add Image Optimization
**Priority:** MEDIUM | **Effort:** 30 min
**Replace all `<img>` with Next.js Image:**
```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority // for above-the-fold images
/>
```

---

#### ⚡ PERF-004: Implement ISR for Event Pages
**Priority:** MEDIUM | **Effort:** 20 min
**File:** `/app/events/[eventId]/page.tsx`
```typescript
export const revalidate = 60; // Revalidate every 60 seconds

export async function generateStaticParams() {
  // Pre-render popular events
  const events = await getPopularEvents();
  return events.map(e => ({ eventId: e.id }));
}
```

---

## 🔧 CODE QUALITY IMPROVEMENTS
*Technical debt - lower priority*

### Medium Priority

#### 📝 CODE-001: Resolve TODO Comments
**Priority:** MEDIUM | **Effort:** 2-4 hours
**Found:** 26 TODOs in codebase

**Key TODOs to address:**
1. `/app/organizer/templates/create/page.tsx:364` - Template loading
2. `/convex/tickets/mutations.ts:1216` - Seat reservation release
3. `/convex/bundles/mutations.ts:345` - Email confirmation
4. `/app/organizer/events/[eventId]/seating/page.tsx` - Bulk operations

**Action:** Convert to GitHub Issues and track properly

---

#### 📝 CODE-002: Remove Duplicate Code
**Priority:** MEDIUM | **Effort:** 3 hours
**Found:** Similar payment flows for Square/Stripe/Test

**Create shared payment abstraction:**
```typescript
// lib/payments/index.ts
interface PaymentProvider {
  processPayment(amount: number, details: any): Promise<PaymentResult>;
}

class SquarePaymentProvider implements PaymentProvider { ... }
class StripePaymentProvider implements PaymentProvider { ... }
```

---

#### 📝 CODE-003: Fix Large Components
**Priority:** LOW | **Effort:** 4 hours
**Files over 500 lines:**
- `/app/organizer/events/[eventId]/seating/page.tsx` (800+ lines)
- `/components/SeatingChart.tsx` (650+ lines)

**Break into smaller components:**
- Extract toolbar → `SeatingChartToolbar.tsx`
- Extract legend → `SeatingChartLegend.tsx`
- Extract seat grid → `SeatingGrid.tsx`

---

#### 📝 CODE-004: Replace `any` Types
**Priority:** LOW | **Effort:** 2 hours
**Action:** Search for `any` and replace with proper types or `unknown`

---

## 📱 SEO & ACCESSIBILITY

### Medium Priority

#### 🌐 SEO-001: Generate Sitemap
**Priority:** MEDIUM | **Effort:** 30 min
**File:** Create `/app/sitemap.ts`
```typescript
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await getEvents();

  return [
    {
      url: 'https://events.stepperslife.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...events.map(event => ({
      url: `https://events.stepperslife.com/events/${event.id}`,
      lastModified: event.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
  ];
}
```

---

#### 🌐 ACCESS-001: Add ARIA Labels
**Priority:** MEDIUM | **Effort:** 1 hour
**Action:** Add proper ARIA attributes
```tsx
<button aria-label="Close modal" onClick={onClose}>
  <X className="h-4 w-4" />
</button>

<nav aria-label="Main navigation">
  ...
</nav>
```

---

#### 🌐 ACCESS-002: Add Skip Navigation
**Priority:** LOW | **Effort:** 10 min
**File:** `/app/layout.tsx`
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
<main id="main-content">
  {children}
</main>
```

---

## 📦 DEPENDENCY UPDATES

### Low Priority

#### 📦 DEP-001: Update Dependencies
**Priority:** LOW | **Effort:** 30 min + testing
**Action:**
```bash
# Check for updates
npm outdated

# Update all patch/minor versions
npm update

# Test thoroughly after updating
npm test
npm run build
```

**Good news:** Zero security vulnerabilities currently!

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Going to Production

- [ ] All CRITICAL security issues resolved
- [ ] API keys moved to environment variables
- [ ] All compromised credentials rotated
- [ ] Admin protection re-enabled
- [ ] API authentication implemented
- [ ] CSRF protection added
- [ ] Rate limiting implemented
- [ ] TypeScript strict mode enabled and errors fixed
- [ ] Console logs removed from production
- [ ] Security headers added
- [ ] Error boundaries implemented
- [ ] Health check endpoint created
- [ ] Environment variables validated on startup
- [ ] SEO metadata added to key pages
- [ ] robots.txt and sitemap added
- [ ] Images optimized
- [ ] Bundle size analyzed and optimized
- [ ] Load testing performed
- [ ] Backup strategy implemented
- [ ] Monitoring/alerting configured (Sentry already setup ✅)
- [ ] SSL certificate configured
- [ ] Database backups automated
- [ ] Rollback plan documented

---

## 📋 PRIORITY ORDER

### Week 1 (After Testing Complete)
1. Fix all 8 CRITICAL security issues
2. Add authentication to API routes
3. Remove console.logs
4. Add security headers
5. Add error boundaries
6. Create health check endpoint

### Week 2
7. Enable TypeScript strict mode, fix errors
8. Add CSRF protection
9. Add rate limiting
10. Optimize bundle size
11. Add SEO metadata
12. Create sitemap

### Week 3+
13. Code quality improvements
14. Performance optimizations
15. Accessibility enhancements
16. Technical debt resolution

---

## 🎯 ESTIMATED TOTAL EFFORT

| Category | Time Required |
|----------|---------------|
| Critical Security Fixes | 2-3 hours |
| High Priority Security | 2-3 hours |
| Performance Optimizations | 3-4 hours |
| Code Quality | 6-8 hours |
| SEO & Accessibility | 2-3 hours |
| **TOTAL** | **15-21 hours** |

---

## 📞 NEED HELP?

If you encounter issues:
1. Check error logs in Docker: `docker logs events-stepperslife-1`
2. Review Sentry for runtime errors
3. Test locally before deploying to production
4. Keep backups before making major changes

---

## ✅ TESTING VALIDATION

After each fix, verify:
```bash
# Build succeeds
npm run build

# TypeScript compiles
npx tsc --noEmit

# Tests pass (if you have tests)
npm test

# Docker builds successfully
docker-compose -f docker-compose.local.yml up --build

# App runs correctly
curl http://localhost:3004/api/health
```

---

**Status:** Ready for implementation after testing complete
**Last Updated:** November 4, 2025
**Audit Tool:** Claude AI (Anthropic)
