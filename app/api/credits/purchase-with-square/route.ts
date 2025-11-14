/**
 * Square Credit Purchase API
 *
 * POST /api/credits/purchase-with-square
 * Process credit purchases using Square payment processor
 *
 * @example Request Body
 * {
 *   "userId": "user_id",
 *   "credits": 1000,
 *   "sourceId": "square_token",
 *   "verificationToken": "..." // Optional for 3D Secure
 * }
 *
 * @example Success Response
 * {
 *   "success": true,
 *   "data": {
 *     "paymentId": "...",
 *     "credits": 1000,
 *     "message": "Successfully purchased 1000 ticket credits"
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { SquareClient, SquareEnvironment } from "square";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { randomUUID } from "crypto";
import {
  squareCreditPurchaseSchema,
  validateRequest,
  formatValidationError,
} from "@/lib/validations/payment";
import {
  calculateCreditAmount,
  logPaymentEvent,
  logPaymentError,
  generateRequestId,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/payment";
import { LOG_PREFIX, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/constants/payment";
import type {
  SquarePayment,
  PaymentSuccessResponse,
  PaymentPendingResponse,
  PaymentErrorResponse,
} from "@/lib/types/payment";
import { convexClient as convex } from "@/lib/auth/convex-client";

// Initialize Square client (singleton)
const squareEnvironment =
  process.env.SQUARE_ENVIRONMENT === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: squareEnvironment,
});

/**
 * POST handler for Square credit purchases
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<PaymentSuccessResponse | PaymentPendingResponse | PaymentErrorResponse>> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(squareCreditPurchaseSchema, body);

    if (!validation.success) {
      const errorMessage = formatValidationError(validation.error);
      logPaymentError(LOG_PREFIX.SQUARE, new Error(errorMessage), {
        requestId,
        body,
      });

      return NextResponse.json(
        createErrorResponse(errorMessage, {
          code: "VALIDATION_ERROR",
          fields: validation.error.errors,
        }),
        { status: 400 }
      );
    }

    const { userId, credits, sourceId, verificationToken } = validation.data;

    // Calculate amount using utility function
    const amountInCents = calculateCreditAmount(credits);

    logPaymentEvent(LOG_PREFIX.SQUARE, "credit_purchase_start", {
      requestId,
      userId,
      credits,
      amountInCents,
    });

    // Create payment with Square
    const idempotencyKey = randomUUID();
    const paymentRequest = {
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(amountInCents),
        currency: "USD",
      },
      locationId: process.env.SQUARE_LOCATION_ID!,
      note: `Credit purchase: ${credits} tickets for user ${userId}`,
      referenceId: userId,
      ...(verificationToken && { verificationToken }),
    };

    const { result } = await squareClient.paymentsApi.createPayment(paymentRequest);

    const payment: SquarePayment | undefined = result.payment;

    if (!payment) {
      logPaymentError(LOG_PREFIX.SQUARE, new Error("Payment creation returned no payment object"), {
        requestId,
        userId,
        credits,
      });

      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.PAYMENT_FAILED, {
          code: "NO_PAYMENT_OBJECT",
        }),
        { status: 500 }
      );
    }

    // Handle different payment statuses
    if (payment.status === "COMPLETED") {
      // Payment successful - add credits to user account
      try {
        await convex.mutation(api.credits.mutations.purchaseCredits, {
          userId: userId as Id<"users">,
          credits,
          amountPaid: amountInCents,
          squarePaymentId: payment.id!,
        });

        const duration = Date.now() - startTime;

        logPaymentEvent(LOG_PREFIX.SQUARE, "credit_purchase_success", {
          requestId,
          userId,
          credits,
          paymentId: payment.id,
          duration,
        });

        return NextResponse.json(
          createSuccessResponse(
            {
              paymentId: payment.id!,
              credits,
            },
            SUCCESS_MESSAGES.CREDITS_PURCHASED(credits)
          ),
          { status: 200 }
        );
      } catch (convexError: unknown) {
        // Payment succeeded but credit allocation failed
        logPaymentError(LOG_PREFIX.SQUARE, convexError, {
          requestId,
          userId,
          credits,
          paymentId: payment.id,
          stage: "convex_mutation_failed",
        });

        return NextResponse.json(
          createErrorResponse(
            "Payment succeeded but credit allocation failed. Please contact support.",
            {
              code: "CREDIT_ALLOCATION_FAILED",
              paymentId: payment.id,
              requestId,
            }
          ),
          { status: 500 }
        );
      }
    } else if (payment.status === "PENDING") {
      // Payment is pending - wait for webhook
      logPaymentEvent(LOG_PREFIX.SQUARE, "credit_purchase_pending", {
        requestId,
        userId,
        credits,
        paymentId: payment.id,
      });

      return NextResponse.json(
        {
          success: true,
          pending: true,
          paymentId: payment.id!,
          message: "Payment is being processed",
        },
        { status: 200 }
      );
    } else {
      // Payment failed or other status
      logPaymentError(
        LOG_PREFIX.SQUARE,
        new Error(`Payment failed with status: ${payment.status}`),
        {
          requestId,
          userId,
          credits,
          paymentId: payment.id,
          status: payment.status,
        }
      );

      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.PAYMENT_FAILED, {
          code: "PAYMENT_DECLINED",
          status: payment.status,
        }),
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const duration = Date.now() - startTime;

    logPaymentError(LOG_PREFIX.SQUARE, error, {
      requestId,
      duration,
      type: "credit_purchase_error",
    });

    // Handle Square API errors specifically
    if (error && typeof error === "object" && "result" in error) {
      const squareError = error as { result?: { errors?: Array<{ detail?: string }> } };
      const errors = squareError.result?.errors;
      const errorDetail = errors?.[0]?.detail || "Unknown Square API error";

      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.PAYMENT_FAILED, {
          code: "SQUARE_API_ERROR",
          details: errorDetail,
        }),
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.SERVER_ERROR, {
        code: "INTERNAL_ERROR",
        requestId,
      }),
      { status: 500 }
    );
  }
}
