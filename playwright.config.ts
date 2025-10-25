import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  // Run tests in sequence (not parallel) to avoid conflicts
  fullyParallel: false,
  forbidOnly: false,

  // Don't retry on failure for clearer test results
  retries: 0,

  // Use 1 worker to run tests sequentially
  workers: 1,

  // Use list reporter for detailed console output
  reporter: [["list"], ["html", { outputFolder: "test-results/html-report", open: "never" }]],

  // Global timeout settings
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  use: {
    // Base URL for the application
    baseURL: "https://events.stepperslife.com",

    // Capture trace on first retry
    trace: "on-first-retry",

    // Screenshot settings
    screenshot: "only-on-failure",

    // Video recording
    video: "retain-on-failure",

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors (for self-signed certs)
    ignoreHTTPSErrors: true,

    // Navigation timeout
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Enable console log capture
        launchOptions: {
          args: ["--disable-dev-shm-usage"],
        },
      },
    },
  ],

  // We're testing the live production site
  webServer: undefined,
});
