# Security Model Documentation
**SteppersLife Event Ticketing Platform**

**Version:** 1.0
**Last Updated:** October 25, 2025

---

## Security Layers

### 1. Authentication (@convex-dev/auth)

**Providers:**
- Email/password (Convex Password provider)
- Google OAuth

**Session Management:**
- JWT tokens
- HTTP-only cookies
- 7-day expiry
- Automatic refresh

**Implementation:**
```typescript
// convex/auth.ts
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";

export const { auth, signIn, signOut } = convexAuth({
  providers: [Password(), Google()],
});
```

---

### 2. Authorization (RBAC)

**Roles:**
- **Public** - Unauthenticated users (can view events, purchase tickets)
- **User** - Registered users (can manage profile, view tickets)
- **Organizer** - Event creators (can manage their events)
- **Staff** - Event scanners (can scan tickets for assigned events)

**Authorization Checks:**

```typescript
// Check if user is event organizer
const event = await ctx.db.get(eventId);
const identity = await ctx.auth.getUserIdentity();
if (event.organizerId !== identity.subject) {
  throw new Error("Not authorized");
}
```

---

### 3. Payment Security (Stripe)

**PCI Compliance:**
- No card data stored (Stripe Elements)
- Tokenization at client
- HTTPS required

**Stripe Connect:**
- Express accounts for organizers
- KYC verification required
- Bank account validation

**Webhook Security:**
- Signature verification required
- Replay attack prevention

```typescript
// Verify webhook signature
const signature = req.headers.get("stripe-signature");
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

---

### 4. QR Code Security

**HMAC Signatures:**
```typescript
const data = `${ticketInstanceId}:${timestamp}`;
const signature = crypto
  .createHmac("sha256", process.env.QR_CODE_SECRET_KEY)
  .update(data)
  .digest("hex");
```

**Validation:**
- Signature must match
- Timestamp within 24 hours
- One-time use (status check)

---

### 5. Input Validation (Zod)

**All inputs validated:**
```typescript
import { z } from "zod";

const EventSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  startDate: z.number().min(Date.now()),
});
```

---

### 6. XSS Prevention

**React Auto-Escaping:**
- All user input escaped by default
- Use `dangerouslySetInnerHTML` only with sanitized HTML

**Rich Text (TipTap):**
- HTML sanitization enabled
- Allowed tags whitelist

---

### 7. CSRF Protection

**SameSite Cookies:**
```typescript
Set-Cookie: session=...; SameSite=Lax; HttpOnly; Secure
```

**No CSRF tokens needed** (SameSite sufficient)

---

### 8. Rate Limiting

**Status:** Phase 2

**Planned:**
- 100 requests/minute per user
- 10 login attempts per hour
- Exponential backoff

---

## Environment Variables Security

**Never Commit:**
```bash
# .gitignore includes:
.env.local
.env.production
```

**Required Secrets:**
```bash
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
QR_CODE_SECRET_KEY
AUTH_GOOGLE_SECRET
```

**Storage:** Secure environment variable storage (server only)

---

## HTTPS/TLS

**Required:** TLS 1.3
**Certificate:** Let's Encrypt (auto-renewal)
**HSTS:** Enabled

---

## Document Control

**Version:** 1.0
**Last Updated:** October 25, 2025
**Maintained By:** Development Team
