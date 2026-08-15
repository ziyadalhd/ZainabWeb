import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { thmanyahSans } from "./fonts";
import { getSiteUrl, isSiteIndexingEnabled } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: "نادي بَيْن الثقافي",
  title: {
    default: "نادي بَيْن الثقافي",
    template: "%s | نادي بَيْن الثقافي",
  },
  description: "الموقع العربي لنادي بَيْن الثقافي في مكة.",
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: "نادي بَيْن الثقافي",
    title: "نادي بَيْن الثقافي",
    description: "الموقع العربي لنادي بَيْن الثقافي في مكة.",
  },
  twitter: {
    card: "summary",
    title: "نادي بَيْن الثقافي",
    description: "الموقع العربي لنادي بَيْن الثقافي في مكة.",
  },
  robots: isSiteIndexingEnabled()
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true },
};

export const viewport: Viewport = {
  themeColor: "#FFF1CA",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={thmanyahSans.variable} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
