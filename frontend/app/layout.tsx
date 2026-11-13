import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Campo",
    template: "%s | Campo",
  },
  description: "Campo - Admission & Leads Management System",
  applicationName: "Campo",
  icons: {
    icon: [
      { url: "/campo-logos/favicon.ico" },
      { url: "/campo-logos/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/campo-logos/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/campo-logos/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/campo-logos/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/campo-logos/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/campo-logos/favicon.ico"],
  },
  openGraph: {
    title: "Campo - Admission & Leads Management",
    description: "Track your leads, admissions, and opportunities with Campo.",
    siteName: "Campo",
    images: [
      {
        url: "/campo-logos/og-image.png",
        width: 800,
        height: 800,
        alt: "Campo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campo",
    description: "Campo - Admission & Leads Management System",
    images: ["/campo-logos/og-image.png"],
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
        <link rel="icon" href="/campo-logos/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/campo-logos/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/campo-logos/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/campo-logos/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-title" content="Campo" />
        <meta name="application-name" content="Campo" />
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
