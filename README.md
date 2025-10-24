# 🎫 SteppersLife Events Platform

A modern, full-featured event ticketing platform built with Next.js 16, Convex, and Square Payments.

## ✨ Features

### For Event Organizers
- **Event Management**: Create and manage events with rich details (title, description, images, dates, location)
- **Multi-Tier Ticketing**: Support for multiple ticket tiers (General Admission, VIP, Early Bird, etc.)
- **Payment Models**: Choose between Pre-Purchase (30¢/ticket) or Pay-as-Sell (3.7% + $1.79 per sale)
- **Real-Time Analytics**: Track revenue, ticket sales, orders, and attendees
- **Dashboard**: Comprehensive organizer dashboard with statistics and insights
- **Order Management**: View and manage all ticket orders

### For Attendees
- **Event Discovery**: Browse and search upcoming stepping events
- **Secure Checkout**: PCI-compliant payment processing with Square
- **Multiple Payment Methods**: Credit/debit cards via Square Web SDK
- **Magic Link Authentication**: Passwordless login via email
- **Ticket Management**: View and manage purchased tickets
- **Email Confirmations**: Automated confirmation emails via Resend

### Technical Features
- **Next.js 16**: App Router with React 19 Server Components
- **Convex Backend**: Real-time database with type-safe queries and mutations
- **Square Payments**: Production-ready payment processing (tested on GangRun Printing)
- **Resend Emails**: Beautiful transactional emails
- **TypeScript**: Full type safety across frontend and backend
- **Framer Motion**: Smooth animations and transitions
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Git

### 1. Clone Repository
```bash
git clone https://github.com/iradwatkins/event.stepperslife.com.git
cd event.stepperslife.com
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create `.env.local` in the project root:

```bash
# Convex (Database)
NEXT_PUBLIC_CONVEX_URL=https://combative-viper-389.convex.cloud
CONVEX_DEPLOYMENT=dev:combative-viper-389

# Square (Payments) - SANDBOX for testing
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sandbox-sq0idb-YOUR_APP_ID
SQUARE_ACCESS_TOKEN=YOUR_SANDBOX_ACCESS_TOKEN
NEXT_PUBLIC_SQUARE_LOCATION_ID=YOUR_SANDBOX_LOCATION_ID
NEXT_PUBLIC_SQUARE_ENVIRONMENT=sandbox

# Resend (Emails)
RESEND_API_KEY=re_YOUR_API_KEY
RESEND_FROM_EMAIL=SteppersLife Events <onboarding@resend.dev>

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3004
NODE_ENV=development
```

### 4. Start Convex Development Server
```bash
npx convex dev
```

Keep this running in a separate terminal.

### 5. Start Next.js Development Server
```bash
npm run dev
```

Visit `http://localhost:3004`

## 📚 Documentation

- **[SELF-HOSTING.md](./SELF-HOSTING.md)**: Complete guide for deploying to production
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Vercel deployment guide (alternative)
- **[.env.production.example](./.env.production.example)**: Production environment variables template

## 🌐 Production Deployment

### Recommended: Railway (Easiest)

1. **Sign up at Railway**: https://railway.app/
2. **Connect GitHub repository**: `iradwatkins/event.stepperslife.com`
3. **Add environment variables** (see `.env.production.example`)
4. **Deploy automatically** from main branch

**Estimated time**: 15 minutes | **Cost**: ~$5-20/month

### Alternative: DigitalOcean, Render, VPS

See [SELF-HOSTING.md](./SELF-HOSTING.md) for complete instructions on all deployment options.

## 📋 Post-Deployment Checklist

1. [ ] Switch Square to production credentials
2. [ ] Verify domain in Resend for unlimited emails
3. [ ] Configure DNS for `event.stepperslife.com`
4. [ ] Test magic link authentication
5. [ ] Create a test event
6. [ ] Purchase a test ticket with real card (small amount)
7. [ ] Verify email confirmations arrive
8. [ ] Check organizer dashboard analytics

## 🏗️ Project Structure

```
event.stepperslife.com/
├── app/                          # Next.js App Router
│   ├── (home)/                   # Public pages (events, checkout)
│   ├── organizer/                # Organizer dashboard
│   ├── login/                    # Authentication
│   └── api/                      # API routes
├── components/                   # React components
│   ├── checkout/                 # Payment components (Square, Cash App)
│   ├── events/                   # Event components
│   └── ui/                       # UI primitives
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── events/                   # Event queries/mutations
│   ├── tickets/                  # Ticket management
│   └── orders/                   # Order processing
├── lib/                          # Utilities
│   └── square.ts                 # Square payment functions
└── public/                       # Static assets
```

## 🔧 Technology Stack

**Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion
**Backend**: Convex, Square API, Resend API
**Deployment**: Railway, DigitalOcean, Render, or VPS

## 💳 Payment Processing

### Square Integration
- **Sandbox Mode**: Test with fake cards during development
- **Production Mode**: Process real payments in production
- **Test Card**: `4111 1111 1111 1111` (any future expiry, any CVV)

### Fees
- **Square**: 2.9% + $0.30 per transaction
- **Platform (Pay-as-Sell)**: 3.7% + $1.79 per sale
- **Pre-Purchase**: $0.30 per ticket (200 free for first event)

## 📧 Email Configuration

**Development**: Magic links logged to console, emails sent via Resend (limited to verified email)

**Production**:
1. Verify domain in Resend: https://resend.com/domains
2. Add DNS records (SPF, DKIM, DMARC)
3. Update `RESEND_FROM_EMAIL` to `events@stepperslife.com`

## 🐛 Common Issues

**"Resend validation error"**: In development, emails only send to verified email. Production requires domain verification.

**"Square payment failed"**: Check you're using correct environment (sandbox vs production). Sandbox only accepts test cards.

**"Convex not connected"**: Ensure `npx convex dev` is running in separate terminal.

**"DNS_PROBE_FINISHED_NXDOMAIN"**: Domain not configured yet. Use `localhost:3004` for development.

## 💰 Cost Breakdown

**Development**: Free (Convex free tier, Resend free tier, Square sandbox)

**Production** (~$50/month for 1,000 tickets):
- Hosting: $5-25/month
- Domain: ~$1/month
- Convex: Free (within limits)
- Resend: Free (within limits)
- Square Fees: ~$35 on $1,000 in sales

## 📄 License

Proprietary - All rights reserved

---

**Ready to launch?** 🚀

1. Follow the [Quick Start](#-quick-start) guide
2. Read [SELF-HOSTING.md](./SELF-HOSTING.md) for deployment
3. Configure production environment variables
4. Deploy to your preferred platform
5. Start selling tickets!

For deployment support, see [SELF-HOSTING.md](./SELF-HOSTING.md).
