import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import * as bcrypt from "bcryptjs";
import { convexClient as convex } from "@/lib/auth/convex-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Please provide all required fields" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json(
        { error: "Password must contain uppercase, lowercase, and numbers" },
        { status: 400 }
      );
    }

    // Check if user already exists
    try {
      const existingUser = await convex.query(api.users.queries.getUserByEmail, {
        email: email.toLowerCase(),
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
    } catch (error) {
      // If getUserByEmail throws an error (user not found), that's expected
      // Continue with registration
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user in Convex
    const userId = await convex.mutation(api.users.mutations.createUser, {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "organizer", // Default role
    });

    if (!userId) {
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
    }

    // Initialize credits for the new user (300 welcome bonus)
    try {
      await convex.mutation(api.credits.mutations.initializeCredits, {
        userId,
        initialCredits: 300,
      });
    } catch (error) {
      console.error("Failed to initialize credits:", error);
      // Don't fail registration if credits initialization fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully! Please log in.",
        userId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
