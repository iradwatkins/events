import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SteppersLife Events - Discover Amazing Stepping Events Nationwide",
  description:
    "Your premier platform for discovering and attending stepping events. Buy tickets, manage events with advanced seating charts, and connect with the stepping community.",
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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* ServiceWorkerRegister disabled during testing */}
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
