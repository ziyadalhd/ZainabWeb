import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  buildRegistrationsCsv,
  filterRegistrationsForExport,
  isRegistrationExportScope,
} from "@/lib/export/registrations-csv";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const filenames = {
  current: "bayn-current-registrations.csv",
  previous: "bayn-previous-registrations.csv",
  waitlist: "bayn-waitlist.csv",
} as const;

export async function GET(request: NextRequest) {
  await requireAdmin();

  const scope = request.nextUrl.searchParams.get("scope");
  if (!isRegistrationExportScope(scope)) {
    return new Response("طلب التصدير غير صالح.", { status: 400 });
  }

  const repository = await createAdminRegistrationRepository();
  const outcome = await repository.list();
  if (!outcome.ok) {
    return new Response("تعذر تحميل بيانات التسجيلات حاليًا.", { status: 502 });
  }
  const registrations = filterRegistrationsForExport(outcome.data, scope);

  return new Response(buildRegistrationsCsv(registrations), {
    headers: {
      "Content-Disposition": `attachment; filename="${filenames[scope]}"`,
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
