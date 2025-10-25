import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://aba7ae328b85a86cfffc763b430dc463@o4510231346216960.ingest.us.sentry.io/4510231347920896",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  environment: process.env.NODE_ENV || "production",
});
