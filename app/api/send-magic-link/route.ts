import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured. Please add RESEND_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    // Generate a magic link token (in production, this should be stored in database)
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'}/auth/verify?token=${token}`;

    // DEV MODE: In development, log the magic link to console (optional quick access)
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      console.log('\n🔐 ===== MAGIC LINK (DEV MODE) =====');
      console.log('📧 Email:', email);
      console.log('🔗 Magic Link:', magicLink);
      console.log('=====================================\n');
    }

    // Send email with Resend (works in both dev and production)
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'SteppersLife Events <onboarding@resend.dev>',
      to: [email],
      subject: "Your Magic Link to Sign In",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sign In to SteppersLife Events</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">SteppersLife Events</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0;">Your premier event platform</p>
            </div>

            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #111827; margin-top: 0;">Sign In to Your Account</h2>

              <p style="color: #6b7280; font-size: 16px; margin-bottom: 30px;">
                Click the button below to securely sign in to your SteppersLife Events account. This link will expire in 15 minutes for your security.
              </p>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${magicLink}" style="display: inline-block; background: #2563eb; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Sign In to SteppersLife Events
                </a>
              </div>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  <strong>Security Note:</strong> This link can only be used once and will expire in 15 minutes. If you didn't request this email, you can safely ignore it.
                </p>
              </div>

              <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
                Or copy and paste this link into your browser:<br>
                <span style="color: #2563eb; word-break: break-all;">${magicLink}</span>
              </p>
            </div>

            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 5px 0;">SteppersLife Events - Discover and manage amazing stepping events</p>
              <p style="margin: 5px 0;">© ${new Date().getFullYear()} SteppersLife Events. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: `
Sign In to SteppersLife Events

Click the link below to sign in to your account:
${magicLink}

This link will expire in 15 minutes for security.

If you didn't request this email, you can safely ignore it.

---
SteppersLife Events
© ${new Date().getFullYear()} SteppersLife Events. All rights reserved.
      `.trim(),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }

    console.log("Magic link sent successfully:", { email, messageId: data?.id });

    return NextResponse.json({
      success: true,
      message: "Magic link sent successfully",
    });

  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
