import type { Metadata } from "next";

import { GLOBAL_NOINDEX_ENABLED, PUBLIC_SITE_URL } from "@/lib/env.public";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  title: "ListAcrossEU v2",
  description: "European Business Directory",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
