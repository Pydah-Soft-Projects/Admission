import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Campo",
  description: "Track your leads and opportunities",
  icons: {
    icon: "/Lead Tracker.png",
    apple: "/Lead Tracker.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import { SSOHandler } from "@/components/SSOHandler";
import { PortalSwitcher } from "@/components/PortalSwitcher";
import { Suspense } from "react";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeServer =
    process.env.NEXT_PUBLIC_THEME_SERVER ||
    (process.env.NODE_ENV === "production"
      ? "https://ui-theme.pydah.edu.in"
      : "http://localhost:7000");

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        {/* Centralized Theme Runtime Loader */}
        <Script
          src={`${themeServer}/themes/theme-loader.js`}
          strategy="beforeInteractive"
          data-theme-server={themeServer}
          data-poll-interval={process.env.NODE_ENV === "production" ? 30 : 10}
        />
        {/* Direct CSS link fallback */}
        <link rel="stylesheet" href={`${themeServer}/themes/theme.css`} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          <Suspense fallback={null}>
            <SSOHandler />
          </Suspense>
          <Suspense fallback={null}>
            <PortalSwitcher />
          </Suspense>
          {children}
          <PwaInstallPrompt />
        </Providers>
        <Script
          id="pydah-portal-switcher-cdn-script"
          src="https://crm.pydah.edu.in/portal-switcher.js"
          data-current-portal="admissions-crm"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
