# VPS Deployment Instructions

## Step 1: SSH to your server

```bash
ssh root@72.60.28.175
# Password: Bobby321&Gloria321Watkins?
cd /root/websites/events-stepperslife
```

## Step 2: Backup current code

```bash
cp -r /root/websites/events-stepperslife /root/websites/events-stepperslife.backup.$(date +%Y%m%d-%H%M%S)
```

## Step 3: Update package.json

```bash
nano package.json
```

Find and DELETE this line (around line 41):
```
    "next-auth": "^5.0.0-beta.29",
```

Save and exit (Ctrl+O, Enter, Ctrl+X)

## Step 4: Update components/convex-client-provider.tsx

```bash
cat > components/convex-client-provider.tsx << 'EOF'
"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import { ReactNode, useMemo } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), []);

  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}
EOF
```

## Step 5: Update app/page.tsx

```bash
# Edit app/page.tsx
nano app/page.tsx
```

Find line 5 and change from:
```typescript
import { useSession, signOut } from "next-auth/react";
```

To:
```typescript
// TESTING MODE: No authentication
// import { useSession, signOut } from "next-auth/react";
```

Find line 18-19 and change from:
```typescript
export default function Home() {
  const { data: session, status } = useSession();
```

To:
```typescript
export default function Home() {
  // TESTING MODE: No authentication
  // const { data: session, status } = useSession();
  const session = null;
  const status = "unauthenticated";
```

Save and exit (Ctrl+O, Enter, Ctrl+X)

## Step 6: Update app/organizer/events/create/page.tsx

```bash
nano app/organizer/events/create/page.tsx
```

Find line 6 and change from:
```typescript
import { useSession } from "next-auth/react";
```

To:
```typescript
// TESTING MODE: No authentication
// import { useSession } from "next-auth/react";
```

Find lines 38-39 and change from:
```typescript
  const router = useRouter();
  const { data: session, status } = useSession();
```

To:
```typescript
  const router = useRouter();
  // TESTING MODE: No authentication
  // const { data: session, status } = useSession();
  const session = null;
  const status = "unauthenticated";
```

Save and exit (Ctrl+O, Enter, Ctrl+X)

## Step 7: Update convex/events/queries.ts

```bash
nano convex/events/queries.ts
```

Find the `getOrganizerEvents` function and replace it with:

```typescript
/**
 * Get organizer's events
 * TESTING MODE: Returns all events (no authentication)
 */
export const getOrganizerEvents = query({
  args: {},
  handler: async (ctx) => {
    // TESTING MODE: No authentication required
    console.warn("[getOrganizerEvents] TESTING MODE - No authentication required");

    // Return all events for now
    const events = await ctx.db
      .query("events")
      .order("desc")
      .collect();

    return events;
  },
});
```

Save and exit (Ctrl+O, Enter, Ctrl+X)

## Step 8: Update app/organizer/events/page.tsx

```bash
nano app/organizer/events/page.tsx
```

Find the section around line 18 and comment out authentication:

```typescript
export default function OrganizerEventsPage() {
  // TESTING MODE: Commented out authentication check
  // const currentUser = useQuery(api.users.queries.getCurrentUser);
  const events = useQuery(api.events.queries.getOrganizerEvents);

  const isLoading = events === undefined;

  // TESTING MODE: Skip auth check
  // if (!currentUser) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  //       <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
  //         <p className="text-gray-600 mb-4">Please sign in to access your organizer dashboard.</p>
  //         <Link href="/login" className="text-blue-600 hover:underline font-medium">
  //           Sign In
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }
```

Save and exit (Ctrl+O, Enter, Ctrl+X)

## Step 9: Remove middleware.ts (if it exists and is empty)

```bash
rm -f middleware.ts
```

## Step 10: Create .env.local

```bash
cat > .env.local << 'EOF'
# Production Environment Variables
# TESTING MODE - No authentication or payments

# ===== CONVEX (Database) =====
NEXT_PUBLIC_CONVEX_URL=https://combative-viper-389.convex.cloud
CONVEX_DEPLOYMENT=dev:combative-viper-389

# ===== APPLICATION =====
NEXT_PUBLIC_APP_URL=https://event.stepperslife.com
NODE_ENV=production
EOF
```

## Step 11: Install dependencies

```bash
npm install
```

## Step 12: Initialize Convex (IMPORTANT!)

```bash
npx convex dev
```

This will:
- Prompt you to login to Convex
- Use the existing project (combative-viper-389)
- Deploy all schema and functions

Press Ctrl+C after it says "Watching for changes..."

## Step 13: Build the application

```bash
npm run build
```

## Step 14: Restart PM2

```bash
pm2 restart events-stepperslife
# OR if it doesn't exist yet:
pm2 start npm --name "events-stepperslife" -- start
pm2 save
```

## Step 15: Check status

```bash
pm2 status
pm2 logs events-stepperslife --lines 50
```

## Step 16: Test the application

Visit: https://event.stepperslife.com

Navigate to:
- https://event.stepperslife.com/organizer/events (should work without login)
- https://event.stepperslife.com/organizer/events/create (should work without login)

---

## Quick Copy-Paste Version

If you want to do this faster, here's a script you can copy and paste:

```bash
cd /root/websites/events-stepperslife

# Backup
cp -r . ../events-stepperslife.backup.$(date +%Y%m%d-%H%M%S)

# Remove middleware
rm -f middleware.ts

# The rest requires manual editing of files OR
# you can use sed commands (risky, better to edit manually)
```

Let me know if you need any clarification!
