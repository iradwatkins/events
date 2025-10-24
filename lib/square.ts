import { Client, Environment } from "square";

// Initialize Square client
const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SQUARE_ENVIRONMENT === "production"
    ? Environment.Production
    : Environment.Sandbox,
});

export const squareClient = client;

// Square configuration
export const SQUARE_CONFIG = {
  applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!,
  locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
  environment: process.env.SQUARE_ENVIRONMENT || "sandbox",
};

// Payment processing fees (Square rates)
export const PAYMENT_FEES = {
  // Square processing fees: 2.9% + $0.30 per transaction
  SQUARE_PERCENT: 2.9,
  SQUARE_FIXED_CENTS: 30,

  // Platform fees for Pay-As-Sell model
  PLATFORM_FEE_PERCENT: 3.7,
  PLATFORM_FEE_FIXED_CENTS: 179, // $1.79

  // Pre-Purchase model
  CREDIT_PRICE_CENTS: 30, // $0.30 per ticket
  FIRST_EVENT_FREE_CREDITS: 200,
};

/**
 * Calculate fees for a transaction
 */
export function calculateTransactionFees(
  amountCents: number,
  paymentModel: "PRE_PURCHASE" | "PAY_AS_SELL"
) {
  let platformFee = 0;
  let processingFee = 0;

  if (paymentModel === "PAY_AS_SELL") {
    // Calculate platform fee: percentage + fixed
    platformFee = Math.round(
      (amountCents * PAYMENT_FEES.PLATFORM_FEE_PERCENT) / 100
    ) + PAYMENT_FEES.PLATFORM_FEE_FIXED_CENTS;

    // Calculate Square processing fee on total (subtotal + platform fee)
    const totalBeforeProcessing = amountCents + platformFee;
    processingFee = Math.round(
      (totalBeforeProcessing * PAYMENT_FEES.SQUARE_PERCENT) / 100
    ) + PAYMENT_FEES.SQUARE_FIXED_CENTS;
  } else {
    // Pre-purchase: only Square processing fee
    processingFee = Math.round(
      (amountCents * PAYMENT_FEES.SQUARE_PERCENT) / 100
    ) + PAYMENT_FEES.SQUARE_FIXED_CENTS;
  }

  const totalAmount = amountCents + platformFee + processingFee;

  return {
    subtotal: amountCents,
    platformFee,
    processingFee,
    totalAmount,
    organizerReceives: amountCents - platformFee, // Organizer pays platform fee
  };
}

/**
 * Format cents to dollars
 */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Format dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Create a payment for ticket purchase
 */
export async function createTicketPayment(params: {
  sourceId: string; // Payment token from Square Web SDK
  amount: number; // Amount in cents
  orderId: string; // Convex order ID
  buyerEmail: string;
  buyerName: string;
  idempotencyKey: string;
}) {
  try {
    const { result } = await client.paymentsApi.createPayment({
      sourceId: params.sourceId,
      idempotencyKey: params.idempotencyKey,
      amountMoney: {
        amount: BigInt(params.amount),
        currency: "USD",
      },
      locationId: SQUARE_CONFIG.locationId,
      referenceId: params.orderId,
      buyerEmailAddress: params.buyerEmail,
      note: `Ticket purchase for order ${params.orderId}`,
      autocomplete: true,
    });

    return {
      id: result.payment?.id || "",
      status: result.payment?.status || "",
      receiptUrl: result.payment?.receiptUrl || "",
      amount: result.payment?.totalMoney?.amount
        ? Number(result.payment.totalMoney.amount)
        : 0,
      createdAt: result.payment?.createdAt || "",
    };
  } catch (error: any) {
    console.error("Square payment error:", error);

    // Handle specific error types
    if (error?.errors && Array.isArray(error.errors)) {
      const errorCode = error.errors[0]?.code;
      const errorDetail = error.errors[0]?.detail || "Payment failed";

      // Map error codes to user-friendly messages
      switch (errorCode) {
        case "CARD_DECLINED":
          throw new Error("Card was declined. Please try a different card.");
        case "INSUFFICIENT_FUNDS":
          throw new Error("Insufficient funds. Please use a different card.");
        case "INVALID_CARD_DATA":
          throw new Error("Invalid card information. Please check your details.");
        case "CVV_FAILURE":
          throw new Error("CVV verification failed. Please check your security code.");
        case "EXPIRATION_FAILURE":
          throw new Error("Card has expired. Please use a different card.");
        default:
          throw new Error(errorDetail);
      }
    }

    throw new Error("Payment processing failed. Please try again.");
  }
}

/**
 * Retrieve payment details
 */
export async function getPayment(paymentId: string) {
  try {
    const { result } = await client.paymentsApi.getPayment(paymentId);

    return {
      id: result.payment?.id,
      status: result.payment?.status,
      amount: result.payment?.totalMoney?.amount
        ? Number(result.payment.totalMoney.amount)
        : 0,
      receiptUrl: result.payment?.receiptUrl,
      referenceId: result.payment?.referenceId,
      buyerEmail: result.payment?.buyerEmailAddress,
      createdAt: result.payment?.createdAt,
    };
  } catch (error) {
    console.error("Failed to retrieve payment:", error);
    throw new Error("Failed to retrieve payment details");
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(params: {
  paymentId: string;
  amount: number; // Amount in cents
  reason?: string;
  idempotencyKey: string;
}) {
  try {
    const { result } = await client.refundsApi.refundPayment({
      paymentId: params.paymentId,
      idempotencyKey: params.idempotencyKey,
      amountMoney: {
        amount: BigInt(params.amount),
        currency: "USD",
      },
      reason: params.reason || "Customer requested refund",
    });

    return {
      id: result.refund?.id || "",
      status: result.refund?.status || "",
      amount: result.refund?.amountMoney?.amount
        ? Number(result.refund.amountMoney.amount)
        : 0,
      createdAt: result.refund?.createdAt || "",
    };
  } catch (error: any) {
    console.error("Square refund error:", error);
    throw new Error("Refund processing failed");
  }
}
