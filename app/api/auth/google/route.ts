/**
 * Google OAuth Initiation Route
 *
 * GET /api/auth/google
 * Redirects user to Google OAuth consent screen
 */

import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/auth/google-oauth";
import { randomBytes } from "crypto";

export async function GET(request: NextRequest) {
  try {
    // Generate state for CSRF protection
    const state = randomBytes(32).toString("hex");

    // Get callback URL from query params (optional)
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/organizer/events";

    // Store state and callbackUrl in a cookie for verification later
    const response = NextResponse.redirect(getGoogleAuthUrl(state));

    // Set secure HTTP-only cookies
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    response.cookies.set("oauth_callback_url", callbackUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Google OAuth] Initiation error:", error);
    return NextResponse.json({ error: "Failed to initiate Google OAuth" }, { status: 500 });
  }
}
