import type { ReactNode } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { requireAdmin } from "@/lib/auth/require-admin";

// Every admin surface renders per-admin operational data through a cookie-scoped Supabase client,
// so nothing under this layout is cacheable. Latency is addressed by streaming (Suspense
// boundaries inside each page), not by relaxing this.
export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireAdmin();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--color-page)] lg:grid lg:grid-cols-[18rem_1fr]">
        <a className="skip-link" href="#admin-content">
          تخطي إلى المحتوى
        </a>
        <AdminSidebar />
        <div className="min-w-0">
          <AdminHeader />
          <div id="admin-content" tabIndex={-1}>
            {children}
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
