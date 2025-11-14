import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import {
  generateMagicLinkToken,
  hashToken,
  sendMagicLinkEmail,
  getTokenExpiry,
} from "@/lib/auth/magic-link";
import { convexClient as convex } from "@/lib/auth/convex-client";

export async function POST(request: NextRequest) {
  try {
    const { email, callbackUrl } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Generate secure token
    const token = generateMagicLinkToken();
    const hashedToken = hashToken(token);
    const expiry = getTokenExpiry();

    // Store hashed token in database
    // This will create user if doesn't exist, or update existing user
    await convex.mutation(api.auth.mutations.storeMagicLinkToken, {
      email,
      tokenHash: hashedToken,
      expiry,
    });

    // Get user name if exists
    const user = await convex.query(api.users.queries.getUserByEmail, { email });

    // Send magic link email with callback URL encoded in token
    const callbackParam = callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
    const verificationUrl = `${process.env.NEXTAUTH_URL || "https://events.stepperslife.com"}/api/auth/verify-magic-link?token=${token}${callbackParam}`;

    // Update the email to include callback URL
    await sendMagicLinkEmailWithCallback(email, verificationUrl, user?.name);


    return NextResponse.json({
      success: true,
      message: "Magic link sent to your email",
    });
  } catch (error: any) {
    console.error("[Magic Link] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send magic link" },
      { status: 500 }
    );
  }
}

/**
 * Send magic link email with custom verification URL
 */
async function sendMagicLinkEmailWithCallback(
  email: string,
  verificationUrl: string,
  name?: string
): Promise<void> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "Steppers Life Events <noreply@events.stepperslife.com>",
      to: email,
      subject: "Sign in to Steppers Life Events",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Steppers Life Events</h1>
            </div>

            <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              ${name ? `<p style="font-size: 16px;">Hi ${name},</p>` : '<p style="font-size: 16px;">Hi there,</p>'}

              <p style="font-size: 16px; margin: 20px 0;">
                Click the button below to sign in to your Steppers Life Events account. This link will expire in 15 minutes.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                  Sign In to Your Account
                </a>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                If you didn't request this email, you can safely ignore it.
              </p>

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
                <p style="margin: 5px 0;">Steppers Life Events</p>
                <p style="margin: 5px 0;">Bringing the steppers community together</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

  } catch (error: any) {
    console.error("[Magic Link] Failed to send email:", error);
    throw new Error(`Failed to send magic link email: ${error.message}`);
  }
}
