import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the session token
    const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;
    if (!JWT_SECRET) {
      console.error("[Convex Token] JWT_SECRET not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);

    try {
      const { payload } = await jwtVerify(sessionToken.value, secret);

      // Create a Convex-compatible JWT token
      // Convex expects specific fields in the token
      // The token identifier format: domain|applicationID|subject
      const tokenIdentifier = `https://events.stepperslife.com|convex|${payload.userId}`;

      const convexToken = await new SignJWT({
        sub: tokenIdentifier,
        iss: "https://events.stepperslife.com",
        aud: "convex",
        email: payload.email as string,
        name: payload.name,
        role: payload.role,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(secret);

      return NextResponse.json({ token: convexToken });
    } catch (error) {
      console.error("[Convex Token] Invalid session token:", error);
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
  } catch (error) {
    console.error("[Convex Token] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
