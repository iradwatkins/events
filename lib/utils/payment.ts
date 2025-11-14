/**
 * Payment Utility Functions
 *
 * Shared utilities for payment processing to reduce code duplication
 * and ensure consistent behavior across payment APIs
 */

import { PRICING, TIMEOUTS, CURRENCIES, LOG_PREFIX } from '../constants/payment';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PayPalAccessToken {
  token: string;
  expiresAt: number;
}

export interface PaymentAmount {
  cents: number;
  dollars: string;
  currency: string;
}

export interface PaymentError {
  message: string;
  code?: string;
  details?: unknown;
}

// ============================================================================
// PayPal Token Management with Caching
// ============================================================================

let cachedPayPalToken: PayPalAccessToken | null = null;

/**
 * Get PayPal access token with caching to reduce API calls
 * Tokens are cached for 50 minutes (valid for 1 hour)
 */
export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid
  if (cachedPayPalToken && cachedPayPalToken.expiresAt > now) {
    return cachedPayPalToken.token;
  }

  // Fetch new token
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_SECRET_KEY = process.env.PAYPAL_SECRET_KEY;
  const PAYPAL_API_BASE = getPayPalApiBase();

  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET_KEY) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET_KEY}`).toString('base64');

  try {
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(TIMEOUTS.PAYPAL_API_TIMEOUT),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`${LOG_PREFIX.PAYPAL} Token fetch failed:`, errorData);
      throw new Error('Failed to obtain PayPal access token');
    }

    const data = await response.json();

    // Cache token with expiration (token valid for 1 hour, cache for 50 min)
    cachedPayPalToken = {
      token: data.access_token,
      expiresAt: now + TIMEOUTS.TOKEN_CACHE_DURATION,
    };

    return data.access_token;
  } catch (error) {
    console.error(`${LOG_PREFIX.PAYPAL} Token fetch error:`, error);
    throw new Error('Failed to authenticate with PayPal');
  }
}

/**
 * Get PayPal API base URL based on environment
 */
export function getPayPalApiBase(): string {
  return process.env.PAYPAL_ENVIRONMENT === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
}

/**
 * Clear cached PayPal token (useful for testing or error recovery)
 */
export function clearPayPalTokenCache(): void {
  cachedPayPalToken = null;
}

// ============================================================================
// Amount Conversion Utilities
// ============================================================================

/**
 * Convert cents to dollars with proper formatting
 */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Calculate credit purchase amount
 */
export function calculateCreditAmount(credits: number): number {
  return credits * PRICING.PRICE_PER_TICKET_CENTS;
}

/**
 * Create payment amount object
 */
export function createPaymentAmount(
  cents: number,
  currency: string = CURRENCIES.DEFAULT
): PaymentAmount {
  return {
    cents,
    dollars: centsToDollars(cents),
    currency,
  };
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Unknown error occurred';
}

/**
 * Create standardized payment error object
 */
export function createPaymentError(
  message: string,
  code?: string,
  details?: unknown
): PaymentError {
  return {
    message,
    code,
    details,
  };
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'AbortError' || error.message.includes('timeout');
  }
  return false;
}

// ============================================================================
// Logging Utilities
// ============================================================================

/**
 * Generate unique request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log payment event with structured data
 */
export function logPaymentEvent(
  prefix: string,
  event: string,
  data?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const requestId = generateRequestId();

}

/**
 * Log payment error with context
 */
export function logPaymentError(
  prefix: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = extractErrorMessage(error);

  console.error(
    JSON.stringify({
      timestamp,
      prefix,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    })
  );
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate payment amount is within acceptable range
 */
export function isValidPaymentAmount(cents: number): boolean {
  return (
    Number.isInteger(cents) &&
    cents > 0 &&
    cents <= 10000000 // $100,000 max
  );
}

/**
 * Validate credit amount
 */
export function isValidCreditAmount(credits: number): boolean {
  return Number.isInteger(credits) && credits >= 100 && credits <= 10000;
}

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): boolean {
  return CURRENCIES.SUPPORTED.includes(currency as any);
}

// ============================================================================
// Idempotency Utilities
// ============================================================================

/**
 * Generate idempotency key from request data
 * Useful for preventing duplicate payments
 */
export function generateIdempotencyKey(data: Record<string, unknown>): string {
  const crypto = require('crypto');
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// ============================================================================
// Response Formatting
// ============================================================================

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): { success: true; data: T; message?: string } {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  details?: unknown
): { success: false; error: string; details?: unknown } {
  return {
    success: false,
    error,
    ...(details && { details }),
  };
}

// ============================================================================
// Environment Validation
// ============================================================================

/**
 * Validate required environment variables are set
 */
export function validatePaymentEnvironment(): {
  valid: boolean;
  missing: string[];
} {
  const required = [
    'NEXT_PUBLIC_SQUARE_APPLICATION_ID',
    'SQUARE_ACCESS_TOKEN',
    'SQUARE_LOCATION_ID',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_SECRET_KEY',
    'NEXT_PUBLIC_CONVEX_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}
