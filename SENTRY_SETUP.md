# Sentry Error Tracking Setup

✅ **Sentry is FULLY CONFIGURED and ACTIVE!**

## Current Status

✅ **Live and Monitoring**
- DSN: `https://aba7ae328b85a86cfffc763b430dc463@o4510231346216960.ingest.us.sentry.io/4510231347920896`
- Organization: `stepperslife`
- Project: `events-stepperslife`
- Environment: `production`

✅ **Installed Packages**
- `@sentry/nextjs` - Full Next.js integration with client, server, and edge runtime support

✅ **Configuration Files**
- `sentry.client.config.ts` - Client-side error tracking with session replay
- `sentry.server.config.ts` - Server-side error tracking
- `sentry.edge.config.ts` - Edge runtime (middleware) error tracking
- `instrumentation.ts` - Next.js instrumentation hooks
- `next.config.ts` - Sentry webpack plugin enabled

✅ **Features Enabled**
- **100% error capture** with session replay
- **10% normal session sampling** for performance monitoring
- **100% transaction tracing** (tracesSampleRate: 1.0)
- React component annotation for better debugging
- Tunnel route `/monitoring` to bypass ad-blockers
- Automatic error filtering (Square payment warnings filtered out)
- Source map uploading for readable stack traces

## Already Configured - No Action Needed!

The platform is **already sending errors to Sentry**. Every error, crash, or exception is automatically captured and sent to your Sentry dashboard.

### View Your Errors

1. Go to [sentry.io](https://sentry.io)
2. Navigate to your project: **events-stepperslife**
3. Click on **Issues** to see all errors

### Test Sentry Integration

Test that Sentry is working by visiting:
```
https://events.stepperslife.com/api/sentry-test
```

This will send a test message to Sentry. You should see it appear in your dashboard within seconds.

## What Gets Tracked

### Client-Side Errors
- JavaScript errors and exceptions
- Unhandled promise rejections
- React component errors
- Network request failures
- Session replays when errors occur

### Server-Side Errors
- API route errors
- Server component errors
- Database errors (Convex mutations)
- Authentication errors

### Enhanced Error Context
All errors include:
- User information (email, session)
- Browser/device information
- URL and route information
- Recent user actions (breadcrumbs)
- Custom tags and context

## Viewing Errors

1. Go to [sentry.io](https://sentry.io)
2. Select your project: **events-stepperslife**
3. View the **Issues** tab to see all errors
4. Click on an error to see:
   - Full stack trace with source maps
   - Session replay (video of what user did before error)
   - User context
   - Environment information

## Testing Sentry

To test if Sentry is working:

```typescript
// In any component or page
throw new Error("Test error for Sentry");
```

Or use the built-in test endpoint:
```bash
curl https://events.stepperslife.com/api/sentry-test
```

## Current Enhanced Logging

In addition to Sentry, we've added detailed console logging to the `createEvent` mutation:

```typescript
[createEvent] Identity: {...}
[createEvent] Looking up user with email: user@example.com
[createEvent] User found: user_id
[createEvent] Creating event with args: {...}
[createEvent] Event created successfully: event_id
```

You can view these logs in:
- **Convex Dashboard**: https://dashboard.convex.dev
- **Local development**: Browser console / terminal
- **Production**: PM2 logs (`pm2 logs events-stepperslife`)

## Troubleshooting

**Build errors about Sentry:**
- Make sure `SENTRY_ORG` and `SENTRY_PROJECT` are set in `.env.local`
- The `SENTRY_AUTH_TOKEN` is optional for local development

**Errors not appearing in Sentry:**
- Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly
- Check that the DSN starts with `https://`
- Ensure you've rebuilt and redeployed after adding credentials

**Source maps not uploading:**
- Set `SENTRY_AUTH_TOKEN` in `.env.local`
- Verify the token has correct permissions (project:releases, org:read)

## Advanced Configuration

### Adjusting Sample Rates

Edit `sentry.client.config.ts` or `sentry.server.config.ts`:

```typescript
Sentry.init({
  tracesSampleRate: 0.1,  // 10% of transactions
  replaysSessionSampleRate: 0.1,  // 10% of sessions
  replaysOnErrorSampleRate: 1.0,  // 100% of errors (recommended)
});
```

### Custom Error Filtering

Add custom filters in any Sentry config file:

```typescript
beforeSend(event) {
  // Don't send specific errors
  if (event.message?.includes("Something irrelevant")) {
    return null;
  }
  return event;
}
```

## Support

- Sentry Documentation: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Sentry Support: https://sentry.io/support/
