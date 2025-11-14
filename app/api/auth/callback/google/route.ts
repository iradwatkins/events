/**
 * Google OAuth Callback Route
 *
 * GET /api/auth/callback/google
 * Handles OAuth callback from Google and creates/signs in user
 */

import { NextRequest, NextResponse } from "next/server";
import { completeGoogleOAuth } from "@/lib/auth/google-oauth";
import { api } from "@/convex/_generated/api";
import { SignJWT } from "jose";
import { convexClient as convex } from "@/lib/auth/convex-client";

export async function GET(request: NextRequest) {
  try {
    // Get OAuth code and state from query params
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const error = request.nextUrl.searchParams.get("error");

    // Check for errors from Google
    if (error) {
      console.error("[Google OAuth] Error from Google:", error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Validate required params
    if (!code || !state) {
      return NextResponse.redirect(new URL("/login?error=missing_params", request.url));
    }

    // Verify state for CSRF protection
    const storedState = request.cookies.get("oauth_state")?.value;
    if (!storedState || storedState !== state) {
      console.error("[Google OAuth] State mismatch");
      return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
    }

    // Get callback URL from cookie
    const callbackUrl = request.cookies.get("oauth_callback_url")?.value || "/organizer/events";

    // Exchange code for user info
    const googleUser = await completeGoogleOAuth(code);

    // Create or update user in Convex
    const userId = await convex.mutation(api.users.mutations.upsertUserFromGoogle, {
      googleId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      image: googleUser.picture,
    });

    // Fetch the complete user data to get role
    const user = await convex.query(api.users.queries.getUserById, { userId });

    // Create session token (JWT)
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || process.env.AUTH_SECRET || "development-secret-change-in-production"
    );

    const token = await new SignJWT({
      userId: userId,
      email: googleUser.email,
      name: googleUser.name,
      role: user?.role || "user",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    // Redirect to callback URL with session
    // Use the proper base URL from environment or request headers (for production behind Nginx)
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "events.stepperslife.com";
    const baseUrl = `${protocol}://${host}`;
    const response = NextResponse.redirect(new URL(callbackUrl, baseUrl));

    // Set session cookie
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".stepperslife.com" : undefined,
    });

    // Clear OAuth cookies
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_callback_url");

    return response;
  } catch (error: any) {
    console.error("[Google OAuth] Callback error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
