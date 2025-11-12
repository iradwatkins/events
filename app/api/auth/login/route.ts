import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// JWT secret - should be in environment variable
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

export async function POST(request: NextRequest) {
  try {
    console.log("[Login] Starting login request");
    const body = await request.json();
    const { email, password } = body;

    console.log("[Login] Email:", email);

    if (!email || !password) {
      console.log("[Login] Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get user from Convex
    console.log("[Login] Querying Convex for user");
    const user = await convex.query(api.auth.queries.getUserByEmail, {
      email: email.toLowerCase(),
    });
    console.log("[Login] User found:", !!user);

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user._id,
      email: user.email,
      role: user.role || "user",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d") // Token expires in 30 days
      .sign(JWT_SECRET);

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Set cookie (using session_token for consistency with OAuth)
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Login] Login error:", error);
    console.error("[Login] Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Internal server error", debug: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
