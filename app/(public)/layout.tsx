import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <a className="skip-link" href="#public-content">تخطي إلى المحتوى</a>
      <SiteHeader />
      <div id="public-content" tabIndex={-1}>{children}</div>
      <SiteFooter />
    </>
  );
}
