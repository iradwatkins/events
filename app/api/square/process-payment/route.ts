import { NextRequest, NextResponse } from "next/server";
import { squareClient, calculateTransactionFees, centsToDollars } from "@/lib/square";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, amount, orderId, eventId, eventName, buyerEmail } = body;

    // Validate required fields
    if (!sourceId || !amount || !orderId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Process payment with Square
    const { result } = await squareClient.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(amount),
        currency: "USD",
      },
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
      referenceId: orderId,
      note: `Ticket purchase for ${eventName || "event"}`,
      buyerEmailAddress: buyerEmail,
      autocomplete: true,
    });

    // Check payment status
    if (result.payment?.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        paymentId: result.payment.id,
        status: result.payment.status,
        receiptUrl: result.payment.receiptUrl,
        orderId,
      });
    } else {
      return NextResponse.json(
        {
          error: "Payment not completed",
          status: result.payment?.status,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Square payment error:", error);
    return NextResponse.json(
      {
        error: error.message || "Payment processing failed",
        details: error.errors || [],
      },
      { status: 500 }
    );
  }
}
