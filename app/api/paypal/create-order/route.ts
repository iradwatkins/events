/**
 * PayPal Create Order API
 *
 * POST /api/paypal/create-order
 * Creates a PayPal order for ticket purchases or credit purchases
 *
 * @example Request Body
 * {
 *   "amount": 5000,        // Amount in cents ($50.00)
 *   "currency": "USD",     // Optional, defaults to USD
 *   "orderId": "...",      // Optional Convex order ID for reference
 *   "description": "..."   // Optional description
 * }
 *
 * @example Success Response
 * {
 *   "success": true,
 *   "data": {
 *     "id": "paypal_order_id",
 *     "status": "CREATED",
 *     "links": [...]
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  paypalCreateOrderSchema,
  validateRequest,
  formatValidationError,
} from "@/lib/validations/payment";
import {
  getPayPalAccessToken,
  getPayPalApiBase,
  centsToDollars,
  logPaymentEvent,
  logPaymentError,
  generateRequestId,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/payment";
import { LOG_PREFIX, ERROR_MESSAGES, TIMEOUTS } from "@/lib/constants/payment";
import type {
  PayPalOrderResponse,
  PaymentSuccessResponse,
  PaymentErrorResponse,
} from "@/lib/types/payment";

/**
 * POST handler for creating PayPal orders
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<PaymentSuccessResponse | PaymentErrorResponse>> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(paypalCreateOrderSchema, body);

    if (!validation.success) {
      const errorMessage = formatValidationError(validation.error);
      logPaymentError(LOG_PREFIX.PAYPAL, new Error(errorMessage), {
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

    const { amount, currency, orderId, description } = validation.data;

    logPaymentEvent(LOG_PREFIX.PAYPAL, "create_order_start", {
      requestId,
      amount,
      currency,
      orderId,
    });

    // Get PayPal access token (with caching)
    const accessToken = await getPayPalAccessToken();
    const apiBase = getPayPalApiBase();

    // Create PayPal order
    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId || "ORDER",
          description: description || "Event Ticket Purchase",
          amount: {
            currency_code: currency || "USD",
            value: centsToDollars(amount),
          },
        },
      ],
      application_context: {
        brand_name: "SteppersLife Events",
        landing_page: "NO_PREFERENCE" as const,
        user_action: "PAY_NOW" as const,
        return_url: `${process.env.NEXTAUTH_URL}/api/paypal/capture-order`,
        cancel_url: `${process.env.NEXTAUTH_URL}/events`,
      },
    };

    const orderResponse = await fetch(`${apiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": requestId, // Idempotency
      },
      body: JSON.stringify(orderPayload),
      signal: AbortSignal.timeout(TIMEOUTS.PAYPAL_API_TIMEOUT),
    });

    const orderData: PayPalOrderResponse = await orderResponse.json();

    if (!orderResponse.ok) {
      logPaymentError(LOG_PREFIX.PAYPAL, new Error("Order creation failed"), {
        requestId,
        status: orderResponse.status,
        orderData,
      });

      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.PAYMENT_FAILED, {
          code: "PAYPAL_ORDER_FAILED",
          providerResponse: orderData,
        }),
        { status: 400 }
      );
    }

    const duration = Date.now() - startTime;

    logPaymentEvent(LOG_PREFIX.PAYPAL, "create_order_success", {
      requestId,
      orderId: orderData.id,
      status: orderData.status,
      duration,
    });

    return NextResponse.json(
      createSuccessResponse({
        id: orderData.id,
        status: orderData.status,
        links: orderData.links,
      }),
      { status: 200 }
    );
  } catch (error: unknown) {
    const duration = Date.now() - startTime;

    logPaymentError(LOG_PREFIX.PAYPAL, error, {
      requestId,
      duration,
      type: "create_order_error",
    });

    // Handle timeout errors specifically
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        createErrorResponse("Payment provider request timed out", { code: "TIMEOUT" }),
        { status: 504 }
      );
    }

    // Handle generic errors
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.SERVER_ERROR, {
        code: "INTERNAL_ERROR",
        requestId,
      }),
      { status: 500 }
    );
  }
}
