/**
 * Environment Variable Validator
 * Validates that all required environment variables are set
 * Call this at application startup to fail fast if configuration is missing
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_CONVEX_URL',
  // Note: JWT_SECRET and payment keys should be required after testing
  // Uncomment these when ready for production:
  // 'JWT_SECRET',
  // 'SQUARE_ACCESS_TOKEN',
  // 'SQUARE_APPLICATION_ID',
  // 'SQUARE_LOCATION_ID',
] as const;

const optionalEnvVars = [
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
] as const;

export function validateEnv() {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Check optional but recommended variables
  for (const key of optionalEnvVars) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  // Fail if required variables are missing
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\n` +
      `Please set these in your .env.local file or environment configuration.`
    );
  }

  // Warn about optional variables in development
  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️  Optional environment variables not set:\n${warnings.map(k => `  - ${k}`).join('\n')}`
    );
  }

  // Validate JWT_SECRET strength (when set)
  if (process.env.JWT_SECRET) {
    const secret = process.env.JWT_SECRET;
    if (secret === 'your-secret-key-change-this-in-production') {
      throw new Error(
        'JWT_SECRET is using the default insecure value. ' +
        'Please set a strong random secret in production.'
      );
    }
    if (secret.length < 32) {
      console.warn(
        '⚠️  JWT_SECRET should be at least 32 characters long for security. ' +
        'Current length:', secret.length
      );
    }
  }

  return {
    valid: true,
    warnings,
  };
}

// Export typed environment variables for better IDE support
export const env = {
  CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL!,
  JWT_SECRET: process.env.JWT_SECRET,
  SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN,
  SQUARE_APPLICATION_ID: process.env.SQUARE_APPLICATION_ID,
  SQUARE_LOCATION_ID: process.env.SQUARE_LOCATION_ID,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NODE_ENV: process.env.NODE_ENV,
} as const;
