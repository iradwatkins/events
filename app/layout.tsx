import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import "../styles/seating-design-system.css"; // Seating feature hidden
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/contexts/CartContext";
import { ShoppingCart } from "@/components/ShoppingCart";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { validateEnv } from "@/lib/env-validator";

// Validate environment variables at startup (server-side only)
if (typeof window === "undefined") {
  try {
    validateEnv();
  } catch (error) {
    console.error("❌ Environment validation failed:", error);
    // In development, show the error but don't crash
    // In production, this will prevent the app from starting with invalid config
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "arial"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  title: "SteppersLife Events - Discover Amazing Steppin Events Nationwide",
  description:
    "Your premier platform for discovering and attending steppin events. Buy tickets, manage events with advanced seating charts, and connect with the steppin community.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-light-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-light-512.png", sizes: "512x512", type: "image/png" },
      { url: "/stepperslife-logo-light.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-light-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-light-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SteppersLife Events",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#DC2626",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          forcedTheme={undefined}
        >
          {/* ServiceWorkerRegister disabled during testing */}
          <ConvexClientProvider>
            <CartProvider>
              {children}
              <ShoppingCart />
              <MobileBottomNav />
            </CartProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
