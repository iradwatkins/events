/**
 * Payment System Type Definitions
 *
 * TypeScript interfaces and types for payment-related data structures
 * Ensures type safety across the payment system
 */

// ============================================================================
// PayPal Types
// ============================================================================

export interface PayPalLink {
  href: string;
  rel: string;
  method: 'GET' | 'POST' | 'PATCH';
}

export interface PayPalAmount {
  currency_code: string;
  value: string;
}

export interface PayPalPurchaseUnit {
  reference_id?: string;
  description?: string;
  amount: PayPalAmount;
  payee?: {
    email_address?: string;
    merchant_id?: string;
  };
}

export interface PayPalApplicationContext {
  brand_name?: string;
  landing_page?: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE';
  user_action?: 'CONTINUE' | 'PAY_NOW';
  return_url?: string;
  cancel_url?: string;
}

export interface PayPalOrderResponse {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  links: PayPalLink[];
  purchase_units?: PayPalPurchaseUnit[];
}

export interface PayPalCaptureResponse {
  id: string;
  status: 'COMPLETED' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED';
  purchase_units: Array<{
    reference_id?: string;
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: PayPalAmount;
      }>;
    };
  }>;
}

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  create_time: string;
  resource_type: string;
  resource: {
    id: string;
    custom?: string;
    invoice_number?: string;
    sale_id?: string;
    amount?: PayPalAmount;
    [key: string]: unknown;
  };
}

// ============================================================================
// Square Types
// ============================================================================

export interface SquareMoney {
  amount: bigint;
  currency: string;
}

export interface SquarePayment {
  id?: string;
  status?: 'APPROVED' | 'PENDING' | 'COMPLETED' | 'CANCELED' | 'FAILED';
  amountMoney?: SquareMoney;
  totalMoney?: SquareMoney;
  sourceType?: string;
  cardDetails?: {
    status?: string;
    card?: {
      cardBrand?: string;
      last4?: string;
      expMonth?: number;
      expYear?: number;
    };
  };
  receiptUrl?: string;
  referenceId?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SquarePaymentRequest {
  sourceId: string;
  idempotencyKey: string;
  amountMoney: {
    amount: bigint;
    currency: string;
  };
  locationId: string;
  note?: string;
  referenceId?: string;
  verificationToken?: string;
}

export interface SquareWebhookEvent {
  merchant_id: string;
  type: string;
  event_id: string;
  created_at: string;
  data: {
    type: string;
    id: string;
    object: {
      payment?: SquarePayment;
      refund?: SquareRefund;
      [key: string]: unknown;
    };
  };
}

export interface SquareRefund {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED';
  amountMoney: SquareMoney;
  paymentId: string;
  orderId?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaymentSuccessResponse {
  success: true;
  paymentId: string;
  amount?: number;
  credits?: number;
  message?: string;
}

export interface PaymentPendingResponse {
  success: true;
  pending: true;
  paymentId: string;
  message: string;
}

export interface PaymentErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type PaymentResponse =
  | PaymentSuccessResponse
  | PaymentPendingResponse
  | PaymentErrorResponse;

// ============================================================================
// Credit Purchase Types
// ============================================================================

export interface CreditPurchaseRequest {
  userId: string;
  credits: number;
  sourceId?: string; // For Square
  orderID?: string; // For PayPal
  verificationToken?: string; // For Square 3DS
}

export interface CreditPurchaseResponse {
  success: boolean;
  paymentId?: string;
  credits?: number;
  newBalance?: number;
  transactionId?: string;
  error?: string;
  message?: string;
}

// ============================================================================
// Order Types
// ============================================================================

export interface OrderPaymentInfo {
  orderId: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface OrderCompletionRequest {
  orderId: string;
  paymentIntentId: string;
  paymentMethod?: 'SQUARE' | 'PAYPAL' | 'STRIPE' | 'CASHAPP';
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
}

export interface WebhookProcessingResult {
  success: boolean;
  processed: boolean;
  message?: string;
  error?: string;
}

export type WebhookEvent = PayPalWebhookEvent | SquareWebhookEvent;

// ============================================================================
// Payment Method Types
// ============================================================================

export type PaymentMethodType = 'card' | 'cashapp' | 'paypal';

export type PaymentProviderType = 'SQUARE' | 'PAYPAL' | 'STRIPE' | 'CASHAPP';

export interface PaymentMethodConfig {
  type: PaymentMethodType;
  provider: PaymentProviderType;
  enabled: boolean;
  displayName: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface PaymentErrorDetails {
  code: string;
  message: string;
  field?: string;
  category?: 'VALIDATION' | 'PROVIDER' | 'NETWORK' | 'SERVER';
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown,
    public category?: 'VALIDATION' | 'PROVIDER' | 'NETWORK' | 'SERVER'
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

// ============================================================================
// Logging Types
// ============================================================================

export interface PaymentLogEntry {
  timestamp: string;
  requestId: string;
  event: string;
  provider: PaymentProviderType;
  userId?: string;
  amount?: number;
  status?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
