# Epic 1: Authentication & User Management

**Priority:** P0 (Critical)
**Sprint:** Week 1-2
**Total Points:** 9
**Dependencies:** None (Foundation)

---

## Epic Overview

Implement secure user authentication and profile management using @convex-dev/auth. This epic provides the foundation for all user-specific features including event creation, ticket purchases, and access control.

### Goals
- Enable users to register and authenticate securely
- Support Google OAuth for frictionless sign-up
- Maintain user sessions across browser refreshes
- Allow users to manage their profile information

### Success Criteria
- [ ] Users can register with email/password
- [ ] Users can sign in with Google OAuth
- [ ] Sessions persist reliably
- [ ] Profile information can be updated
- [ ] Email verification working
- [ ] Authentication state synced across tabs

---

## User Stories

## Story 1.1: User Registration with Email/Password

**Priority:** P0 (Critical)
**Effort:** 3 points
**Sprint:** Week 1

### User Story

**As a** new user
**I want to** register with my email and password
**So that** I can create an account to purchase tickets and create events

### Acceptance Criteria

- [ ] User can access registration form at `/register`
- [ ] Form validates email format client-side
- [ ] Password must meet requirements: 8+ chars, 1 uppercase, 1 number
- [ ] Password field has show/hide toggle
- [ ] Email verification email sent upon registration
- [ ] User cannot log in until email is verified
- [ ] Registration form shows clear validation errors
- [ ] Success message shown after registration
- [ ] User redirected to email verification page

### Technical Implementation

#### Convex Functions to Create

**File:** `convex/auth.ts`
```typescript
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { v } from "convex/values";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      verify: async ({ email, code }) => {
        // Email verification logic
      },
    }),
  ],
});
```

**File:** `convex/users/mutations.ts`
```typescript
import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const registerUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Hash password with bcrypt
    // Insert user into users table
    // Send verification email
    // Return user ID
  },
});

export const verifyEmail = mutation({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify code matches
    // Update emailVerified to true
    // Return success
  },
});
```

#### React Components to Build

**File:** `app/(auth)/register/page.tsx`
```typescript
"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const { signIn } = useAuthActions();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasMinLength && hasUppercase && hasNumber;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!validatePassword(formData.password)) {
      setErrors({ password: "Password must be 8+ chars, 1 uppercase, 1 number" });
      return;
    }

    try {
      await signIn("password", formData);
      // Redirect to email verification page
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 border rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Create Account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">{errors.password}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Must be 8+ characters, include 1 uppercase and 1 number
          </p>
        </div>

        {errors.general && (
          <p className="text-sm text-red-500">{errors.general}</p>
        )}

        <Button type="submit" className="w-full">
          Create Account
        </Button>
      </form>

      <p className="text-center mt-4 text-sm">
        Already have an account?{" "}
        <a href="/login" className="text-blue-500 hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
```

#### Database Schema

**Table:** `users` (defined in `convex/schema.ts`)
```typescript
users: defineTable({
  email: v.string(),
  emailVerified: v.boolean(),
  name: v.optional(v.string()),
  phone: v.optional(v.string()),
  profileImage: v.optional(v.string()),
  stripeCustomerId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_email", ["email"]),
```

#### Testing Checklist

- [ ] Valid registration completes successfully
- [ ] Email validation prevents invalid formats
- [ ] Password validation enforces requirements
- [ ] Duplicate email shows clear error
- [ ] Verification email is sent
- [ ] User cannot login before email verification
- [ ] Password show/hide toggle works
- [ ] Form validation is client-side responsive
- [ ] Success state redirects correctly

---

## Story 1.2: User Login

**Priority:** P0 (Critical)
**Effort:** 2 points
**Sprint:** Week 1

### User Story

**As a** registered user
**I want to** log in with my email and password
**So that** I can access my account and purchase tickets

### Acceptance Criteria

- [ ] User can access login form at `/login`
- [ ] Form accepts email and password
- [ ] Invalid credentials show clear error message
- [ ] "Remember me" option available
- [ ] Session persists across browser refreshes
- [ ] User redirected to homepage after successful login
- [ ] Login state synced across browser tabs
- [ ] Password reset link visible on login page

### Technical Implementation

#### Convex Functions to Create

**File:** `convex/users/queries.ts`
```typescript
import { query } from "../_generated/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    return user;
  },
});
```

#### React Components to Build

**File:** `app/(auth)/login/page.tsx`
```typescript
"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn("password", {
        email: formData.email,
        password: formData.password,
      });

      router.push("/");
    } catch (err: any) {
      if (err.message.includes("not verified")) {
        setError("Please verify your email before logging in");
      } else if (err.message.includes("Invalid credentials")) {
        setError("Invalid email or password");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 border rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Sign In</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={formData.rememberMe}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, rememberMe: checked as boolean })
              }
            />
            <label htmlFor="remember" className="text-sm">
              Remember me
            </label>
          </div>

          <a href="/reset-password" className="text-sm text-blue-500 hover:underline">
            Forgot password?
          </a>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="text-center mt-4 text-sm">
        Don't have an account?{" "}
        <a href="/register" className="text-blue-500 hover:underline">
          Create one
        </a>
      </p>
    </div>
  );
}
```

#### Testing Checklist

- [ ] Valid login successful with redirect
- [ ] Invalid credentials show error
- [ ] Unverified email shows specific error
- [ ] Remember me persists session
- [ ] Session works across tabs
- [ ] Forgot password link works
- [ ] Loading state shows during login
- [ ] Error messages are clear

---

## Story 1.3: Google OAuth Sign-In

**Priority:** P1 (High)
**Effort:** 2 points
**Sprint:** Week 1

### User Story

**As a** new or existing user
**I want to** sign in with my Google account
**So that** I can quickly access the platform without creating a password

### Acceptance Criteria

- [ ] Google sign-in button visible on register and login pages
- [ ] Clicking button opens Google OAuth popup/redirect
- [ ] User's Google profile picture and name auto-populated
- [ ] New users automatically created in database
- [ ] Existing users matched by email
- [ ] Redirect to homepage after successful sign-in
- [ ] Works seamlessly on mobile devices

### Technical Implementation

#### Convex Auth Configuration

**File:** `convex/auth.ts`
```typescript
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password(),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
});
```

**Environment Variables** (add to `.env.local`):
```bash
AUTH_GOOGLE_ID=your_google_client_id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your_google_client_secret
```

#### React Components

**File:** `components/auth/GoogleSignInButton.tsx`
```typescript
"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  const { signIn } = useAuthActions();

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google");
    } catch (error) {
      console.error("Google sign-in failed:", error);
    }
  };

  return (
    <Button
      onClick={handleGoogleSignIn}
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        {/* Google logo SVG path */}
      </svg>
      Continue with Google
    </Button>
  );
}
```

**Update:** `app/(auth)/login/page.tsx` and `app/(auth)/register/page.tsx`
```typescript
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

// Add to form:
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-2 bg-white text-gray-500">Or continue with</span>
  </div>
</div>

<GoogleSignInButton />
```

#### Google OAuth Setup Steps

1. **Create Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable Google+ API
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://events.stepperslife.com/api/auth/callback/google`
   - For local dev: `http://localhost:3004/api/auth/callback/google`

2. **Configure Convex:**
   - Add environment variables to Convex dashboard
   - Update `convex/auth.ts` with Google provider

3. **Test Flow:**
   - Click "Continue with Google"
   - Redirected to Google consent screen
   - User approves permissions
   - Redirected back to app
   - User logged in automatically

#### Testing Checklist

- [ ] Google sign-in button renders correctly
- [ ] Click opens Google OAuth popup
- [ ] New user created with Google profile data
- [ ] Existing user matched by email
- [ ] Profile picture imported from Google
- [ ] Name populated automatically
- [ ] Works on desktop browsers
- [ ] Works on mobile browsers
- [ ] Error handling for declined permissions

---

## Story 1.4: User Profile Management

**Priority:** P2 (Medium)
**Effort:** 2 points
**Sprint:** Week 2

### User Story

**As a** logged-in user
**I want to** view and edit my profile information
**So that** my account details are accurate and up-to-date

### Acceptance Criteria

- [ ] User can access profile page at `/dashboard/profile`
- [ ] Profile displays: name, email, phone, profile picture
- [ ] User can edit name and phone number
- [ ] User can upload new profile picture
- [ ] Email is displayed but not editable (requires verification)
- [ ] Changes saved successfully with confirmation message
- [ ] Profile picture previewed before upload

### Technical Implementation

#### Convex Functions to Create

**File:** `convex/users/mutations.ts`
```typescript
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    profileImage: v.optional(v.id("_storage")),
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
      name: args.name,
      phone: args.phone,
      profileImage: args.profileImage,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
```

#### React Components to Build

**File:** `app/(dashboard)/dashboard/profile/page.tsx`
```typescript
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";

export default function ProfilePage() {
  const user = useQuery(api.users.queries.getCurrentUser);
  const updateProfile = useMutation(api.users.mutations.updateProfile);
  const generateUploadUrl = useMutation(api.users.mutations.generateUploadUrl);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      await updateProfile({ profileImage: storageId });

      toast({
        title: "Success",
        description: "Profile picture updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={user.profileImage} />
            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
          </Avatar>

          <div>
            <Label htmlFor="avatar" className="cursor-pointer">
              <Button variant="outline" disabled={uploading}>
                {uploading ? "Uploading..." : "Change Picture"}
              </Button>
            </Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <Button type="submit">Save Changes</Button>
        </form>
      </div>
    </div>
  );
}
```

#### Testing Checklist

- [ ] Profile page loads with user data
- [ ] Name can be edited and saved
- [ ] Phone number can be edited and saved
- [ ] Email is displayed but disabled
- [ ] Profile picture can be uploaded
- [ ] Image preview works before upload
- [ ] Success toast shown on save
- [ ] Error handling for failed uploads
- [ ] Loading states shown appropriately

---

## Epic-Level Acceptance Criteria

Before marking this epic as complete, verify:

- [ ] All 4 user stories completed and tested
- [ ] @convex-dev/auth properly configured
- [ ] Google OAuth credentials set up
- [ ] Email verification working
- [ ] Session management reliable
- [ ] Profile pictures uploading correctly
- [ ] Error messages user-friendly
- [ ] Mobile responsive on all auth pages
- [ ] E2E tests passing for auth flows
- [ ] Security best practices followed

---

## Dependencies & Prerequisites

### External Setup Required
1. **Google OAuth Credentials:**
   - Create OAuth 2.0 Client ID in Google Cloud Console
   - Add authorized redirect URIs
   - Copy Client ID and Secret to environment variables

2. **Email Service:**
   - Configure email service for verification emails (Resend or SendGrid)
   - Set up email templates
   - Test email delivery

### Convex Configuration
```bash
# Install dependencies
npm install @convex-dev/auth@0.0.90

# Configure environment variables in Convex dashboard
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
EMAIL_SERVICE_API_KEY=...
```

---

## Technical Notes

### Session Management
- Sessions handled automatically by @convex-dev/auth
- JWT tokens stored in HTTP-only cookies
- Automatic token refresh
- Cross-tab synchronization built-in

### Security Considerations
- Passwords hashed with bcrypt (handled by @convex-dev/auth)
- Email verification required before login
- Rate limiting on auth endpoints (configure in Convex)
- HTTPS required in production
- Secure cookie flags enabled

### Performance
- Profile queries cached on client
- Image uploads direct to Convex storage (no intermediate server)
- Optimistic updates for profile changes
- Lazy load profile picture

---

## Related Files

**Convex:**
- `convex/auth.ts` - Auth configuration
- `convex/users/mutations.ts` - User mutations
- `convex/users/queries.ts` - User queries
- `convex/schema.ts` - Database schema

**Frontend:**
- `app/(auth)/register/page.tsx` - Registration page
- `app/(auth)/login/page.tsx` - Login page
- `app/(dashboard)/dashboard/profile/page.tsx` - Profile page
- `components/auth/GoogleSignInButton.tsx` - OAuth button
- `middleware.ts` - Auth middleware for protected routes

**Configuration:**
- `.env.local` - Environment variables
- `next.config.ts` - Next.js configuration

---

## Next Epic

➡️ **Epic 2: Event Creation & Management** ([epic-02-events.md](./epic-02-events.md))

After authentication is complete, users will be able to create and manage events.
