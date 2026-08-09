import type { Metadata } from "next";

import { GLOBAL_NOINDEX_ENABLED, GOOGLE_SITE_VERIFICATION, PUBLIC_SITE_URL } from "@/lib/env.public";
import AnalyticsConsent from "@/components/AnalyticsConsent";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  title: "ListAcrossEU v2",
  description: "European Business Directory",
  verification: {
    google: GOOGLE_SITE_VERIFICATION || undefined,
  },
  robots: GLOBAL_NOINDEX_ENABLED
    ? {
        index: false,
        follow: false,
      }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <AnalyticsConsent
          gaMeasurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
          clarityProjectId={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}
        />
      </body>
    </html>
  );
}
