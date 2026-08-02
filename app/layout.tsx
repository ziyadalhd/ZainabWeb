import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "نادي بَيْن الثقافي",
    template: "%s | نادي بَيْن الثقافي",
  },
  description: "الموقع العربي لنادي بَيْن الثقافي في مكة.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
