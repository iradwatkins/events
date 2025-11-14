"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { SquareClient, SquareEnvironment } from "square";
import { randomUUID } from "crypto";
import { internal } from "../_generated/api";

// Initialize Square client
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT;

if (!SQUARE_ACCESS_TOKEN) {
  console.error("[Square Actions] CRITICAL: SQUARE_ACCESS_TOKEN is not set!");
}

const squareEnvironment =
  SQUARE_ENVIRONMENT === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox;

const client = new SquareClient({
  token: SQUARE_ACCESS_TOKEN!,
  environment: squareEnvironment,
});

/**
 * Process refund via Square API
 */
export const processSquareRefund = action({
  args: {
    paymentId: v.string(),
    amountCents: v.number(),
    orderId: v.id("orders"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {

      // Call Square Refunds API
      const refundResult = await client.refunds.refundPayment({
        idempotencyKey: randomUUID(),
        paymentId: args.paymentId,
        amountMoney: {
          amount: BigInt(args.amountCents),
          currency: "USD",
        },
        reason: args.reason || "Customer refund requested",
      });


      return {
        success: true,
        refundId: refundResult.refund?.id,
        status: refundResult.refund?.status,
        amountRefunded: args.amountCents,
      };
    } catch (error: any) {
      console.error("[Square Refund] Error:", error);
      console.error("[Square Refund] Error details:", JSON.stringify(error, null, 2));

      // Return error details to mutation
      return {
        success: false,
        error: error?.body?.errors?.[0]?.detail || "Refund processing failed",
      };
    }
  },
});
