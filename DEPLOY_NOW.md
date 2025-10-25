# Quick Deployment Instructions

## Run This Command in Your Terminal

Open your terminal and run:

```bash
cd /Users/irawatkins/Desktop/event.stepperslife.com
./deploy-to-vps.sh
```

## What Will Happen

1. You'll be prompted for the SSH password: `Bobby321&Gloria321Watkins?`
2. The script will sync all your local files to the VPS (excluding node_modules, .next, etc.)
3. You'll be prompted for the password again
4. The script will:
   - Install dependencies
   - Build the application
   - Restart the PM2 process
5. You'll see the deployment status

## After Deployment

Visit: https://event.stepperslife.com

Test these pages:
- https://event.stepperslife.com/organizer/events
- https://event.stepperslife.com/organizer/events/create

## If You Get Errors

If the deployment fails, you can manually SSH and run commands:

```bash
ssh root@72.60.28.175
# Enter password: Bobby321&Gloria321Watkins?

cd /root/websites/events-stepperslife
npm install
npm run build
pm2 restart events-stepperslife
pm2 logs events-stepperslife --lines 50
```

## Changes Being Deployed

- ✅ Removed next-auth dependency
- ✅ Disabled authentication (testing mode)
- ✅ Simplified Convex provider
- ✅ Updated event queries
- ✅ Removed middleware.ts
- ✅ All organizer pages work without login
