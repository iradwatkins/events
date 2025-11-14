import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { hashToken, isTokenExpired } from "@/lib/auth/magic-link";
import { SignJWT } from "jose";
import { convexClient as convex } from "@/lib/auth/convex-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=invalid-token", request.url));
    }

    // Hash token to compare with database
    const hashedToken = hashToken(token);

    // Verify token and get user
    const user = await convex.mutation(api.auth.mutations.verifyMagicLinkToken, {
      tokenHash: hashedToken,
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=invalid-or-expired-token", request.url));
    }

    // Create JWT session token
    const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const sessionToken = await new SignJWT({
      userId: user._id,
      email: user.email,
      name: user.name || user.email,
      role: user.role || "user",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    // Create response with session cookie
    const response = NextResponse.redirect(new URL(callbackUrl, request.url));

    // Set HTTP-only cookie
    response.cookies.set({
      name: "session_token",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    // Also set auth-token for compatibility
    response.cookies.set({
      name: "auth-token",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });


    return response;
  } catch (error: any) {
    console.error("[Magic Link] Verification error:", error);
    return NextResponse.redirect(new URL("/login?error=verification-failed", request.url));
  }
}
