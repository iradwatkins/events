# Phase 2: Security Hardening - Next Steps

**Status:** Ready to begin
**Priority:** 🔴 HIGH - Critical security improvements needed
**Estimated Time:** 14-16 hours

---

## 🎯 What We've Completed

### Phase 1 Achievements ✅
- Removed 725 console.log statements (99.6% reduction)
- Fixed CRITICAL identity logging vulnerability
- Archived 82 obsolete scripts
- Achieved 100% code style consistency
- All changes pushed to GitHub

### Phase 2 Preparation ✅
- Comprehensive security audit completed ([SECURITY-AUDIT-PHASE-2.md](SECURITY-AUDIT-PHASE-2.md))
- Identified 20 vulnerabilities (1 critical, 6 high, 9 medium, 4 low)
- Existing `lib/env-validator.ts` found (needs completion)

---

## 🚨 Critical Findings

### 1. Production Secrets in .env.local (CRITICAL)

**Exposed credentials that MUST be rotated:**
- Convex Deploy Key
- JWT Secret (32 chars)
- Auth Secret
- Google OAuth Client Secret
- Resend API Key
- Square Production Access Token

**Good news:** `.env*` files are in `.gitignore` (never committed)

### 2. Incomplete Environment Validation (HIGH)

**Current state:** Most critical vars are commented out in `lib/env-validator.ts`

**Lines 11-14:**
```typescript
// Note: JWT_SECRET and payment keys should be required after testing
// Uncomment these when ready for production:
// 'JWT_SECRET',
// 'SQUARE_ACCESS_TOKEN',
```

**Action needed:** Enable all production variable validation

---

## 📋 Phase 2 Task List

### IMMEDIATE (Do First) 🔴

**1. Complete Environment Validator**
- [ ] Uncomment all required production vars in `lib/env-validator.ts`
- [ ] Add format validation (e.g., keys must start with proper prefix)
- [ ] Add environment consistency checks (Square public/private env match)
- [ ] Test validation catches missing vars

**2. Implement Security Headers**
- [ ] Add CSP to `next.config.ts`
- [ ] Configure: X-Frame-Options, X-Content-Type-Options, HSTS
- [ ] Test headers with https://securityheaders.com

**3. Add Rate Limiting**
- [ ] Install rate limiting library (e.g., `@upstash/ratelimit`)
- [ ] Protect `/api/auth/login` (5 attempts / 15 min)
- [ ] Protect `/api/auth/register`
- [ ] Protect `/api/auth/reset-password`

### IMPORTANT (Do Next) 🟡

**4. Input Validation & Sanitization**
- [ ] File upload validation (whitelist types, size limits)
- [ ] Password complexity requirements (12+ chars, mixed case, numbers)
- [ ] Form input sanitization

**5. Secret Rotation Documentation**
- [ ] Create step-by-step rotation guide per service
- [ ] Document PM2 restart procedure
- [ ] Test rotation procedure in development

### RECOMMENDED (Nice to Have) 🟢

**6. Security Monitoring**
- [ ] Review Sentry error tracking setup
- [ ] Add failed login attempt logging
- [ ] Set up uptime monitoring

**7. Documentation**
- [ ] Incident response plan
- [ ] Security checklist for deployments
- [ ] Developer security guidelines

---

## ⚠️ Important Notes

### About Secret Rotation

**User decision required:** Rotating production secrets will:
- ✅ Enhance security (recommended)
- ⚠️ Invalidate all existing user sessions (JWT rotation)
- ⚠️ Require updating PM2 environment and restart
- ⚠️ Require re-testing OAuth, payments, emails

**Recommendation:** Plan rotation during low-traffic period

### About Environment Validator

The existing validator is well-structured but has critical vars commented out for "testing". This should be enabled in production.

---

## 🔐 Quick Reference: Where Secrets Are Used

| Secret | Location | Purpose |
|--------|----------|---------|
| `CONVEX_DEPLOY_KEY` | Build/deploy only | Convex deployments |
| `JWT_SECRET` | Runtime | Session tokens |
| `AUTH_GOOGLE_CLIENT_SECRET` | Runtime | Google OAuth |
| `RESEND_API_KEY` | Runtime | Email sending |
| `SQUARE_ACCESS_TOKEN` | Runtime | Payment processing |
| `STRIPE_SECRET_KEY` | Runtime | Payment processing |

---

## 📊 Time Estimates

| Task | Estimated Time |
|------|----------------|
| Complete env validator | 1 hour |
| Security headers | 1 hour |
| Rate limiting | 2 hours |
| Input validation | 3 hours |
| Documentation | 2 hours |
| **Testing & verification** | 3 hours |
| **Secret rotation (if done)** | +2 hours |
| **Total** | **14-16 hours** |

---

## ✅ Success Criteria

Phase 2 complete when:
- [x] Security audit document created ✅
- [ ] Environment validator enabled for all production vars
- [ ] Security headers configured and tested
- [ ] Rate limiting active on auth endpoints
- [ ] File upload validation implemented
- [ ] Password complexity enforced
- [ ] Documentation complete
- [ ] All changes tested and deployed

---

## 🚀 Ready to Proceed?

**Next immediate actions:**
1. Update `lib/env-validator.ts` (enable all production vars)
2. Add security headers to `next.config.ts`
3. Implement rate limiting on auth routes

**User consultation needed for:**
- Secret rotation timing (impacts active users)
- Whether to rotate secrets now or document procedure first

---

**Document Created:** 2025-11-14
**Phase 1 Status:** ✅ Complete (100%)
**Phase 2 Status:** 📋 Ready to begin
