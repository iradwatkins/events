# 🚀 Deployment Guide for SteppersLife Events

## Current Status: Local Development Working ✅

Your application is fully functional on `http://localhost:3004`

---

## 🎯 Deployment Options

### Option 1: Vercel (Recommended - 15 minutes)
**Best for:** Next.js apps, automatic deployments, free tier

### Option 2: Netlify (Alternative - 20 minutes)
**Best for:** Static sites, serverless functions

---

## 📋 Pre-Deployment Checklist

- [x] Application runs locally
- [x] Database (Convex) configured
- [x] Square payments configured (Sandbox)
- [x] Email service (Resend) configured
- [ ] Domain DNS configured
- [ ] Production environment variables set
- [ ] Square production credentials ready
- [ ] Domain verified in Resend

---

## 🌐 Step 1: Domain Setup

### Your Domain: `event.stepperslife.com`

#### A. Purchase/Configure Domain
1. **Already own `stepperslife.com`?**
   - Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
   - Find DNS settings

2. **Need to purchase?**
   - Recommended: Cloudflare ($10/year) or Namecheap ($12/year)

#### B. DNS Configuration

**For Vercel Deployment:**
```
Type: CNAME
Name: event
Value: cname.vercel-dns.com
TTL: Auto
```

**For Netlify Deployment:**
```
Type: CNAME
Name: event
Value: [your-site-name].netlify.app
TTL: Auto
```

**Propagation Time:** 5 minutes to 24 hours (usually ~1 hour)

---

## 🚀 Step 2: Deploy to Vercel

### A. Install Vercel CLI (if needed)
```bash
npm install -g vercel
```

### B. Login to Vercel
```bash
vercel login
```

### C. Deploy from Project Directory
```bash
cd "/Users/irawatkins/Desktop/File Cabinet/event.stepperslife.com"
vercel
```

### D. Follow Prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No**
- Project name? **event-stepperslife**
- Directory? **./   (press Enter)**
- Override settings? **No**

### E. Production Deployment
```bash
vercel --prod
```

### F. Add Custom Domain in Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Domains
4. Add `event.stepperslife.com`
5. Follow DNS instructions

---

## 🔐 Step 3: Environment Variables (Production)

### In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add these variables:

```bash
# Convex (same as local)
NEXT_PUBLIC_CONVEX_URL=https://combative-viper-389.convex.cloud
CONVEX_DEPLOYMENT=dev:combative-viper-389

# Square - PRODUCTION (get from Square Dashboard)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-YOUR_PRODUCTION_APP_ID
SQUARE_ACCESS_TOKEN=YOUR_PRODUCTION_ACCESS_TOKEN
NEXT_PUBLIC_SQUARE_LOCATION_ID=YOUR_PRODUCTION_LOCATION_ID
SQUARE_ENVIRONMENT=production

# Resend (same API key, but update from email)
RESEND_API_KEY=re_RJid1ide_12brJc6fbguPRU5WJzMDB6gQ
RESEND_FROM_EMAIL=events@stepperslife.com
NEXT_PUBLIC_APP_URL=https://event.stepperslife.com
```

**Important:** Use production Square credentials, not sandbox!

---

## 📧 Step 4: Verify Domain in Resend

### A. Add Domain to Resend
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: `stepperslife.com`

### B. Add DNS Records
Add these records to your domain DNS:

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
```

**DKIM Records** (Resend will provide these):
```
Type: CNAME
Name: [resend-provided]
Value: [resend-provided]
```

**DMARC Record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@stepperslife.com
```

### C. Update Environment Variable
```bash
RESEND_FROM_EMAIL=events@stepperslife.com
```

---

## 💳 Step 5: Square Production Setup

### A. Get Production Credentials
1. Go to https://developer.squareup.com/apps
2. Switch to "Production" mode (toggle in top right)
3. Copy credentials:
   - Application ID
   - Access Token
   - Location ID

### B. Update Environment Variables
Replace sandbox credentials with production ones in Vercel.

### C. Test with Real Card
Use a real card to test (NOT test card numbers).

---

## 🗂️ Step 6: Convex Production (Optional)

### Current Setup: Dev deployment is fine for production

### For Better Organization (Optional):
```bash
# Create production deployment
npx convex deploy --prod

# Update environment variable
CONVEX_DEPLOYMENT=prod:combative-viper-389
```

---

## ✅ Step 7: Post-Deployment Testing

### Test Checklist:
1. [ ] Visit `https://event.stepperslife.com`
2. [ ] Homepage loads
3. [ ] Login works (magic link emails arrive)
4. [ ] Create event as organizer
5. [ ] Configure ticket tiers
6. [ ] Purchase ticket with real card
7. [ ] Receive confirmation email
8. [ ] View tickets in dashboard
9. [ ] Check organizer dashboard analytics

---

## 🐛 Troubleshooting

### Domain Not Working
- **Check DNS:** Use https://dnschecker.org/
- **Wait:** DNS can take up to 24 hours
- **Clear cache:** Try incognito mode
- **Check Vercel:** Domain should show "Valid Configuration"

### Emails Not Sending
- **Verify domain in Resend**
- **Check DNS records are correct**
- **Wait 15 minutes after DNS changes**
- **Check Resend dashboard for errors**

### Payments Failing
- **Verify production credentials**
- **Check Square dashboard for errors**
- **Ensure HTTPS is enabled (Vercel does this automatically)**
- **Test with different cards**

### Convex Errors
- **Check deployment URL is correct**
- **Verify environment variables**
- **Check Convex dashboard logs**

---

## 📊 Monitoring & Maintenance

### Vercel Analytics
- Free tier includes basic analytics
- View at: https://vercel.com/dashboard/analytics

### Convex Dashboard
- Monitor database queries
- Check function performance
- View logs: https://dashboard.convex.dev

### Square Dashboard
- View transactions
- Check payment success rate
- Monitor chargebacks

### Resend Dashboard
- Email delivery rates
- Bounce/spam reports
- Send volume

---

## 🔒 Security Checklist

- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Environment variables secure (not in git)
- [ ] Square webhook signatures verified
- [ ] CORS configured properly
- [ ] Rate limiting implemented (optional)
- [ ] Error messages don't expose sensitive data

---

## 📈 Performance Optimization (Post-Launch)

### Recommended:
1. **Enable Vercel Analytics**
2. **Set up Sentry** for error tracking
3. **Optimize images** with next/image
4. **Add caching headers**
5. **Implement CDN** for static assets

---

## 💰 Cost Estimates (Monthly)

### Free Tier (Current Setup):
- **Vercel:** Free (Hobby tier)
- **Convex:** Free (up to 1M reads)
- **Resend:** Free (100 emails/day)
- **Square:** 2.9% + $0.30 per transaction
- **Domain:** ~$12/year

### Estimated for 1,000 tickets/month:
- **Vercel:** Free
- **Convex:** Free
- **Resend:** $0 (well under limit)
- **Square fees:** ~$1,000 in sales = $35 in fees
- **Total:** ~$35/month (just payment processing)

---

## 🎉 You're Ready to Launch!

### Quick Deploy Command:
```bash
cd "/Users/irawatkins/Desktop/File Cabinet/event.stepperslife.com"
vercel --prod
```

### Questions?
- Vercel: https://vercel.com/docs
- Square: https://developer.squareup.com/docs
- Convex: https://docs.convex.dev
- Resend: https://resend.com/docs

---

## 📞 Support Contacts

- **Vercel Support:** support@vercel.com
- **Square Support:** developers@squareup.com
- **Convex Support:** support@convex.dev
- **Resend Support:** support@resend.com
