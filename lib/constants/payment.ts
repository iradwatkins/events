/**
 * Payment System Constants
 *
 * Centralized configuration for payment-related values
 * to avoid magic numbers and ensure consistency across the application
 */

// Pricing Constants
export const PRICING = {
  /** Price per ticket in cents ($0.30) */
  PRICE_PER_TICKET_CENTS: 30,

  /** First event free ticket allocation */
  FIRST_EVENT_FREE_TICKETS: 300,

  /** Platform fee percentage for CREDIT_CARD model (3.7%) */
  PLATFORM_FEE_PERCENTAGE: 3.7,

  /** Platform fee fixed amount in cents ($1.79) */
  PLATFORM_FEE_FIXED_CENTS: 179,

  /** Processing fee percentage for CREDIT_CARD model (2.9%) */
  PROCESSING_FEE_PERCENTAGE: 2.9,

  /** Processing fee fixed amount in cents ($0.30) */
  PROCESSING_FEE_FIXED_CENTS: 30,
} as const;

// Credit Package Tiers
export const CREDIT_PACKAGES = [
  { credits: 500, price: 150 },
  { credits: 1000, price: 300, popular: true },
  { credits: 2500, price: 750 },
] as const;

// Validation Limits
export const LIMITS = {
  /** Minimum credit purchase */
  MIN_CREDIT_PURCHASE: 100,

  /** Maximum credit purchase in single transaction */
  MAX_CREDIT_PURCHASE: 10000,

  /** Minimum ticket quantity per order */
  MIN_TICKET_QUANTITY: 1,

  /** Maximum ticket quantity per order */
  MAX_TICKET_QUANTITY: 100,

  /** Maximum amount in cents for single transaction ($100,000) */
  MAX_PAYMENT_AMOUNT_CENTS: 10000000,

  /** Minimum amount in cents for payment ($0.50) */
  MIN_PAYMENT_AMOUNT_CENTS: 50,
} as const;

// Payment Provider Configurations
export const PAYMENT_PROVIDERS = {
  SQUARE: {
    name: 'Square',
    supportedMethods: ['card', 'cashapp'],
  },
  PAYPAL: {
    name: 'PayPal',
    supportedMethods: ['paypal'],
  },
  STRIPE: {
    name: 'Stripe',
    supportedMethods: ['card'],
  },
} as const;

// API Timeouts (in milliseconds)
export const TIMEOUTS = {
  /** PayPal API timeout */
  PAYPAL_API_TIMEOUT: 30000, // 30 seconds

  /** Square API timeout */
  SQUARE_API_TIMEOUT: 30000, // 30 seconds

  /** Webhook processing timeout */
  WEBHOOK_TIMEOUT: 10000, // 10 seconds

  /** Access token cache duration */
  TOKEN_CACHE_DURATION: 3000000, // 50 minutes (tokens valid for 1 hour)
} as const;

// Webhook Event Types
export const WEBHOOK_EVENTS = {
  SQUARE: {
    PAYMENT_CREATED: 'payment.created',
    PAYMENT_UPDATED: 'payment.updated',
    REFUND_CREATED: 'refund.created',
    REFUND_UPDATED: 'refund.updated',
  },
  PAYPAL: {
    PAYMENT_COMPLETED: 'PAYMENT.SALE.COMPLETED',
    PAYMENT_DENIED: 'PAYMENT.SALE.DENIED',
    PAYMENT_REFUNDED: 'PAYMENT.SALE.REFUNDED',
    DISPUTE_CREATED: 'CUSTOMER.DISPUTE.CREATED',
  },
} as const;

// Currency Configuration
export const CURRENCIES = {
  DEFAULT: 'USD',
  SUPPORTED: ['USD'] as const,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  MISSING_FIELDS: 'Missing required fields',
  INVALID_AMOUNT: 'Invalid payment amount',
  INVALID_CREDITS: 'Invalid credit amount',
  PAYMENT_FAILED: 'Payment processing failed',
  INSUFFICIENT_CREDITS: 'Insufficient credits',
  INVALID_SIGNATURE: 'Invalid webhook signature',
  PROVIDER_ERROR: 'Payment provider error',
  SERVER_ERROR: 'Internal server error',
  INVALID_CURRENCY: 'Invalid or unsupported currency',
  AMOUNT_TOO_LARGE: 'Payment amount exceeds maximum allowed',
  AMOUNT_TOO_SMALL: 'Payment amount below minimum required',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PAYMENT_COMPLETED: 'Payment completed successfully',
  CREDITS_PURCHASED: (credits: number) => `Successfully purchased ${credits} ticket credits`,
  ORDER_CREATED: 'Order created successfully',
  WEBHOOK_PROCESSED: 'Webhook processed successfully',
} as const;

// Logging Prefixes
export const LOG_PREFIX = {
  PAYPAL: '[PayPal]',
  SQUARE: '[Square]',
  WEBHOOK: '[Webhook]',
  CREDITS: '[Credits]',
  ORDERS: '[Orders]',
} as const;
