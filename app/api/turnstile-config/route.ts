import { connection, NextResponse } from "next/server";
import { isTurnstileEnabled } from "@/lib/security/turnstile";

export const dynamic = "force-dynamic";

export async function GET() {
  await connection();

  return NextResponse.json(
    {
      enabled: isTurnstileEnabled(),
      siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
