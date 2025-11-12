import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

// Routes that require authentication
const protectedRoutes = [
  "/organizer",
  "/admin",
  "/my-tickets",
];

// Routes that should redirect to home if already authenticated
const authRoutes = ["/login"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Check for both cookie names (session_token is current, auth-token is legacy)
  const token = request.cookies.get("session_token")?.value || request.cookies.get("auth-token")?.value;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Verify token if it exists
  let isAuthenticated = false;
  let userRole = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
      userRole = payload.role as string;
    } catch (error) {
      // Token is invalid, clear both cookies
      // Only redirect if not already on login/register page
      if (!isAuthRoute && !pathname.startsWith("/register")) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("auth-token");
        response.cookies.delete("session_token");
        return response;
      }
      // Just clear cookies and continue
      const response = NextResponse.next();
      response.cookies.delete("auth-token");
      response.cookies.delete("session_token");
      return response;
    }
  }

  // Redirect to login if trying to access protected route without auth
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check admin routes
  if (pathname.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|events/[^/]+$).*)",
  ],
};
