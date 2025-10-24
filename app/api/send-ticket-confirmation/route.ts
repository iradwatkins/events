import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, orderDetails, tickets, event } = await request.json();

    if (!email || !orderDetails || !tickets || !event) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'SteppersLife Events <onboarding@resend.dev>',
      to: [email],
      subject: `Your Tickets for ${event.name}`,
      html: generateTicketConfirmationHTML(email, orderDetails, tickets, event),
      text: generateTicketConfirmationText(email, orderDetails, tickets, event),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    console.log("Ticket confirmation sent:", { email, orderId: orderDetails._id, messageId: data?.id });

    return NextResponse.json({
      success: true,
      message: "Ticket confirmation sent successfully",
    });

  } catch (error) {
    console.error("Ticket email API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

function generateTicketConfirmationHTML(
  email: string,
  orderDetails: any,
  tickets: any[],
  event: any
): string {
  const ticketsHTML = tickets.map((ticket, index) => `
    <div style="background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 18px;">Ticket #${index + 1}</h3>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
            <strong>Code:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 13px;">${ticket.code}</span>
          </p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
            <strong>Type:</strong> ${ticket.tierName}
          </p>
        </div>
        <div style="text-align: right;">
          <div style="background: #10b981; color: white; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 14px;">
            VALID
          </div>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Tickets - ${event.name}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Tickets Confirmed!</h1>
          <p style="color: #d1fae5; margin: 10px 0 0 0;">Your order has been successfully processed</p>
        </div>

        <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #111827; margin-top: 0;">Event Details</h2>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 20px;">${event.name}</h3>
            <p style="margin: 5px 0; color: #6b7280;">
              <strong>📅 Date:</strong> ${new Date(event.startDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p style="margin: 5px 0; color: #6b7280;">
              <strong>🕐 Time:</strong> ${new Date(event.startDate).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
            <p style="margin: 5px 0; color: #6b7280;">
              <strong>📍 Location:</strong> ${event.location.venueName || event.location.city}, ${event.location.state}
            </p>
          </div>

          <h2 style="color: #111827;">Your Tickets</h2>
          <p style="color: #6b7280; margin-bottom: 20px;">
            Keep these tickets safe! Present them at the event entrance for check-in.
          </p>

          ${ticketsHTML}

          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 4px; margin: 30px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">💡 Important Information</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
              <li style="margin: 8px 0;">Save this email or add tickets to your wallet</li>
              <li style="margin: 8px 0;">Arrive early to avoid queues at check-in</li>
              <li style="margin: 8px 0;">Tickets are non-transferable unless stated otherwise</li>
              <li style="margin: 8px 0;">Contact support if you have any questions</li>
            </ul>
          </div>

          <h2 style="color: #111827; margin-top: 40px;">Order Summary</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6b7280;">Order ID:</span>
              <span style="color: #111827; font-weight: 600;">${orderDetails._id}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6b7280;">Quantity:</span>
              <span style="color: #111827; font-weight: 600;">${tickets.length} ticket${tickets.length > 1 ? 's' : ''}</span>
            </div>
            <div style="border-top: 2px solid #e5e7eb; margin: 15px 0; padding-top: 15px; display: flex; justify-content: space-between;">
              <span style="color: #111827; font-weight: 700; font-size: 18px;">Total Paid:</span>
              <span style="color: #111827; font-weight: 700; font-size: 18px;">$${(orderDetails.totalCents / 100).toFixed(2)}</span>
            </div>
          </div>

          <div style="text-align: center; margin: 40px 0 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'}/my-tickets"
               style="display: inline-block; background: #2563eb; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View My Tickets
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 5px 0;">Need help? Contact us at support@stepperslife.com</p>
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} SteppersLife Events. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

function generateTicketConfirmationText(
  email: string,
  orderDetails: any,
  tickets: any[],
  event: any
): string {
  const ticketsText = tickets.map((ticket, index) => `
Ticket #${index + 1}
Code: ${ticket.code}
Type: ${ticket.tierName}
Status: VALID
---`).join('\n');

  return `
🎉 TICKETS CONFIRMED!
Your order has been successfully processed

EVENT DETAILS
${event.name}
Date: ${new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Time: ${new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
Location: ${event.location.venueName || event.location.city}, ${event.location.state}

YOUR TICKETS
Keep these tickets safe! Present them at the event entrance for check-in.

${ticketsText}

IMPORTANT INFORMATION
- Save this email or add tickets to your wallet
- Arrive early to avoid queues at check-in
- Tickets are non-transferable unless stated otherwise
- Contact support if you have any questions

ORDER SUMMARY
Order ID: ${orderDetails._id}
Quantity: ${tickets.length} ticket${tickets.length > 1 ? 's' : ''}
Total Paid: $${(orderDetails.totalCents / 100).toFixed(2)}

View your tickets online:
${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'}/my-tickets

---
Need help? Contact us at support@stepperslife.com
© ${new Date().getFullYear()} SteppersLife Events. All rights reserved.
  `.trim();
}
