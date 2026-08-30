import type { Metadata } from "next";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "لوحة الإدارة", template: "%s | لوحة الإدارة" },
  robots: { index: false, follow: false },
  alternates: null,
};

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
