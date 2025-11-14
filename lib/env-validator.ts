/**
 * Environment Variable Validator
 * Validates that all required environment variables are set
 * Call this at application startup to fail fast if configuration is missing
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_CONVEX_URL',
  'CONVEX_DEPLOY_KEY',
  'JWT_SECRET',
  'AUTH_SECRET',
  'NEXTAUTH_URL',
  'AUTH_GOOGLE_CLIENT_ID',
  'AUTH_GOOGLE_CLIENT_SECRET',
  'RESEND_API_KEY',
  'NEXT_PUBLIC_SQUARE_APPLICATION_ID',
  'NEXT_PUBLIC_SQUARE_LOCATION_ID',
  'NEXT_PUBLIC_SQUARE_ENVIRONMENT',
  'SQUARE_ACCESS_TOKEN',
  'SQUARE_LOCATION_ID',
  'SQUARE_ENVIRONMENT',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
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

  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    if (jwtSecret === 'your-secret-key-change-this-in-production') {
      throw new Error(
        'JWT_SECRET is using the default insecure value. ' +
        'Please set a strong random secret in production.'
      );
    }
    if (jwtSecret.length < 32) {
      throw new Error(
        `JWT_SECRET must be at least 32 characters long for security. Current length: ${jwtSecret.length}`
      );
    }
  }

  // Validate AUTH_SECRET strength
  const authSecret = process.env.AUTH_SECRET;
  if (authSecret && authSecret.length < 32) {
    throw new Error(
      `AUTH_SECRET must be at least 32 characters long for security. Current length: ${authSecret.length}`
    );
  }

  // Validate Square environment consistency
  const squarePublicEnv = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT;
  const squareServerEnv = process.env.SQUARE_ENVIRONMENT;
  if (squarePublicEnv && squareServerEnv && squarePublicEnv !== squareServerEnv) {
    throw new Error(
      `Square environment mismatch: NEXT_PUBLIC_SQUARE_ENVIRONMENT="${squarePublicEnv}" but SQUARE_ENVIRONMENT="${squareServerEnv}". These must match.`
    );
  }

  // Validate API key formats
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && !resendKey.startsWith('re_')) {
    throw new Error('RESEND_API_KEY must start with "re_" (invalid format)');
  }

  const squareToken = process.env.SQUARE_ACCESS_TOKEN;
  if (squareToken && !squareToken.startsWith('EAAA')) {
    console.warn('⚠️  SQUARE_ACCESS_TOKEN may have invalid format (expected to start with "EAAA")');
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && !stripeKey.startsWith('sk_')) {
    throw new Error('STRIPE_SECRET_KEY must start with "sk_" (invalid format)');
  }

  const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (stripePublicKey && !stripePublicKey.startsWith('pk_')) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with "pk_" (invalid format)');
  }

  // Log successful validation in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment validation passed');
    if (warnings.length > 0) {
      console.warn(`⚠️  ${warnings.length} optional variable(s) not set`);
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
