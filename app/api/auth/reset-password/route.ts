import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { convexClient as convex } from "@/lib/auth/convex-client";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain uppercase, lowercase, and numbers" },
        { status: 400 }
      );
    }

    // Hash the token to compare with database
    const hashedToken = createHash("sha256").update(token).digest("hex");

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Verify token and update password
    const result = await convex.mutation(api.auth.mutations.resetPassword, {
      tokenHash: hashedToken,
      passwordHash,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Invalid or expired reset token" },
        { status: 400 }
      );
    }


    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error: any) {
    console.error("[Password Reset] Error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
