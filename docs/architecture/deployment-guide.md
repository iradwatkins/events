# Deployment Guide
**SteppersLife Event Ticketing Platform**

**Version:** 1.0
**Last Updated:** October 25, 2025

---

## Production Environment

**Server:** VPS (Ubuntu 22.04 LTS)
**Domain:** events.stepperslife.com
**Port:** 3004
**Process Manager:** PM2
**Web Server:** Nginx (reverse proxy)

---

## Prerequisites

1. Node.js 20.x installed
2. PM2 installed globally: `npm install -g pm2`
3. Nginx installed
4. SSL certificate configured (Let's Encrypt)

---

## Deployment Steps

### 1. Clone Repository

```bash
cd /root/websites
git clone <repository-url> events-stepperslife
cd events-stepperslife
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Set Environment Variables

```bash
# Create .env.local file
cat > .env.local << 'EOF'
# App
NEXT_PUBLIC_APP_URL=https://events.stepperslife.com
NODE_ENV=production

# Convex
CONVEX_DEPLOYMENT=expert-vulture-775
NEXT_PUBLIC_CONVEX_URL=https://expert-vulture-775.convex.cloud

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
FROM_EMAIL=tickets@stepperslife.com

# QR Security
QR_CODE_SECRET_KEY=<generate-strong-secret>
EOF
```

---

### 4. Build Application

```bash
npm run build
```

---

### 5. Deploy Convex Schema

```bash
npx convex deploy
```

---

### 6. Start PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

### 7. Configure Nginx

```nginx
server {
    listen 80;
    server_name events.stepperslife.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name events.stepperslife.com;

    ssl_certificate /etc/letsencrypt/live/events.stepperslife.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/events.stepperslife.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### 8. Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Monitoring

```bash
# View logs
pm2 logs events-stepperslife

# Monitor
pm2 monit

# Status
pm2 status
```

---

## Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Deploy Convex changes
npx convex deploy

# Restart PM2 (zero-downtime)
pm2 reload events-stepperslife
```

---

## Rollback

```bash
# Revert to previous commit
git reset --hard HEAD~1

# Rebuild
npm run build

# Restart
pm2 reload events-stepperslife
```

---

## Document Control

**Version:** 1.0
**Last Updated:** October 25, 2025
**Maintained By:** DevOps Team
