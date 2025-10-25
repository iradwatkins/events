import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  providers: [
    // Google OAuth SSO (works without database adapter)
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Credentials provider for testing
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TESTING ONLY - Simple hardcoded credentials
        const testUsers = [
          { email: "bobbygwatkins@gmail.com", password: "pass", name: "Bobby Watkins", id: "test-bobby" },
          { email: "ira@irawatkins.com", password: "pass", name: "Ira Watkins", id: "test-ira" },
        ];

        const user = testUsers.find(
          u => u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedRoute =
        nextUrl.pathname.startsWith("/organizer") ||
        nextUrl.pathname.startsWith("/my-tickets");

      if (isOnProtectedRoute) {
        if (isLoggedIn) return true;
        // Redirect unauthenticated users to login with callback URL
        return Response.redirect(
          new URL(`/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, nextUrl)
        );
      }

      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
