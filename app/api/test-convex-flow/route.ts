import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    if (!sessionToken) {
      return NextResponse.json({ step: 1, status: "FAIL", error: "No session token" });
    }

    // Step 1: Verify session token
    const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;
    const secret = new TextEncoder().encode(JWT_SECRET);

    let sessionPayload;
    try {
      const result = await jwtVerify(sessionToken.value, secret);
      sessionPayload = result.payload;
    } catch (error) {
      return NextResponse.json({
        step: 1,
        status: "FAIL",
        error: "Invalid session token",
        details: error instanceof Error ? error.message : String(error),
      });
    }

    // Step 2: Create Convex token
    const convexToken = await new SignJWT({
      sub: sessionPayload.userId as string,
      email: sessionPayload.email as string,
      name: sessionPayload.name,
      role: sessionPayload.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("https://events.stepperslife.com")
      .setAudience("convex")
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    // Step 3: Verify Convex token can be decoded
    let convexPayload;
    try {
      const result = await jwtVerify(convexToken, secret);
      convexPayload = result.payload;
    } catch (error) {
      return NextResponse.json({
        step: 2,
        status: "FAIL",
        error: "Failed to verify convex token",
        details: error instanceof Error ? error.message : String(error),
      });
    }

    return NextResponse.json({
      status: "SUCCESS",
      steps: {
        step1_session: "✅ Session token valid",
        step2_convex_token: "✅ Convex token created",
        step3_verification: "✅ Convex token verified locally",
      },
      sessionPayload,
      convexPayload,
      tokenInfo: {
        issuer: convexPayload.iss,
        audience: convexPayload.aud,
        subject: convexPayload.sub,
        hasAllFields: !!(
          convexPayload.sub &&
          convexPayload.email &&
          convexPayload.name &&
          convexPayload.role
        ),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
