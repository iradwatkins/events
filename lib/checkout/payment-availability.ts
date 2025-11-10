/**
 * Payment availability checker for checkout flows
 *
 * Determines which payment methods are available based on:
 * - Event payment config (organizer-level settings)
 * - Staff cash acceptance settings
 * - Merchant processor configuration
 */

export type MerchantProcessor = 'SQUARE' | 'STRIPE' | 'PAYPAL';
export type PaymentMethod = 'card' | 'cashapp' | 'cash';

export interface PaymentConfig {
  merchantProcessor?: MerchantProcessor;
  creditCardEnabled?: boolean;
  cashAppEnabled?: boolean;
}

export interface AvailablePaymentMethods {
  /** Credit/debit card payments available */
  creditCard: boolean;
  /** Cash App Pay available */
  cashApp: boolean;
  /** Cash in-person available */
  cash: boolean;
  /** Active merchant processor */
  merchantProcessor?: MerchantProcessor;
  /** Cash requires staff approval */
  cashRequiresStaffApproval: boolean;
}

/**
 * Determine available payment methods based on payment config and staff settings
 *
 * Payment Hierarchy:
 * - Organizer Level: Choose merchant processor + enable/disable online methods
 * - Staff Level: Toggle "Accept Cash In-Person" only
 *
 * Visibility Rules:
 * - No processor configured: Only "Cash In-Person" option visible (if staff accepts)
 * - Processor configured: Show enabled online methods + cash (if staff accepts)
 * - Cash orders: Do not require merchant setup, always available when staff opts in
 *
 * @param paymentConfig - Event payment configuration from Convex
 * @param staffAcceptsCash - Whether any staff member accepts cash for this event
 * @returns Available payment methods
 */
export function getAvailablePaymentMethods(
  paymentConfig: PaymentConfig | null | undefined,
  staffAcceptsCash: boolean = false
): AvailablePaymentMethods {
  // No payment config means no online payments configured
  if (!paymentConfig || !paymentConfig.merchantProcessor) {
    return {
      creditCard: false,
      cashApp: false,
      cash: staffAcceptsCash,
      merchantProcessor: undefined,
      cashRequiresStaffApproval: true,
    };
  }

  // Payment config exists - check which methods are enabled
  const creditCard = paymentConfig.creditCardEnabled ?? true; // Default to enabled
  const cashApp = paymentConfig.cashAppEnabled ?? false; // Default to disabled

  return {
    creditCard,
    cashApp,
    cash: staffAcceptsCash,
    merchantProcessor: paymentConfig.merchantProcessor,
    cashRequiresStaffApproval: true,
  };
}

/**
 * Check if any online payment method is available
 *
 * @param methods - Available payment methods
 * @returns true if card or cashapp is available
 */
export function hasOnlinePaymentMethod(methods: AvailablePaymentMethods): boolean {
  return methods.creditCard || methods.cashApp;
}

/**
 * Get default payment method (first available)
 *
 * Priority: card > cashapp > cash
 *
 * @param methods - Available payment methods
 * @returns Default payment method or null if none available
 */
export function getDefaultPaymentMethod(methods: AvailablePaymentMethods): PaymentMethod | null {
  if (methods.creditCard) return 'card';
  if (methods.cashApp) return 'cashapp';
  if (methods.cash) return 'cash';
  return null;
}

/**
 * Validate if a selected payment method is available
 *
 * @param method - Selected payment method
 * @param methods - Available payment methods
 * @returns true if method is available
 */
export function isPaymentMethodAvailable(
  method: PaymentMethod,
  methods: AvailablePaymentMethods
): boolean {
  switch (method) {
    case 'card':
      return methods.creditCard;
    case 'cashapp':
      return methods.cashApp;
    case 'cash':
      return methods.cash;
    default:
      return false;
  }
}

/**
 * Get payment method display name
 *
 * @param method - Payment method
 * @returns Human-readable display name
 */
export function getPaymentMethodDisplayName(method: PaymentMethod): string {
  switch (method) {
    case 'card':
      return 'Credit/Debit Card';
    case 'cashapp':
      return 'Cash App Pay';
    case 'cash':
      return 'Cash In-Person';
    default:
      return 'Unknown';
  }
}

/**
 * Get merchant processor display name
 *
 * @param processor - Merchant processor
 * @returns Human-readable display name
 */
export function getMerchantProcessorDisplayName(processor?: MerchantProcessor): string {
  if (!processor) return 'Not configured';

  switch (processor) {
    case 'SQUARE':
      return 'Square';
    case 'STRIPE':
      return 'Stripe';
    case 'PAYPAL':
      return 'PayPal';
    default:
      return 'Unknown';
  }
}

/**
 * Check if email is required for a payment method
 * Cash payments don't require email (phone is sufficient)
 *
 * @param method - Payment method
 * @returns true if email is required
 */
export function isEmailRequired(method: PaymentMethod): boolean {
  return method !== 'cash';
}
