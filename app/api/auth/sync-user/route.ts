import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * API route to sync user from NextAuth to Convex database
 * Called during OAuth sign-in callback
 */
export async function POST(req: NextRequest) {
  try {
    const { email, name, image } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Upsert user in Convex
    const userId = await convex.mutation(api.users.mutations.upsertUserFromAuth, {
      email,
      name: name || undefined,
      image: image || undefined,
    });

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error("Error syncing user to Convex:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
