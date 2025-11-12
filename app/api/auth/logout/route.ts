import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 }
  );

  // Clear both auth cookies (old and new names)
  response.cookies.delete("auth-token");
  response.cookies.delete("session_token");

  return response;
}
