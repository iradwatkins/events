import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://aba7ae328b85a86cfffc763b430dc463@o4510231346216960.ingest.us.sentry.io/4510231347920896",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Capture 100% of errors with session replay
  replaysOnErrorSampleRate: 1.0,

  // Capture 10% of normal sessions
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  environment: process.env.NODE_ENV || "production",

  beforeSend(event) {
    // Filter out Square payment warnings
    if (event.message?.includes("SQUARE_ACCESS_TOKEN")) {
      return null;
    }
    return event;
  },
});
