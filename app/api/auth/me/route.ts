import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convexClient as convex } from "@/lib/auth/convex-client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get("session_token")?.value || request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Get fresh user data from Convex (without password hash)
    const user = await convex.query(api.users.queries.getUserByIdPublic, {
      userId: payload.userId as Id<"users">,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
