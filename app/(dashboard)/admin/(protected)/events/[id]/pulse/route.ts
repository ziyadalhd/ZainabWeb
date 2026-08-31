import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isEntityId } from "@/lib/domain/entity-id";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";

export const dynamic = "force-dynamic";

/**
 * The roster's live heartbeat: held-seat count plus the newest holder's name.
 *
 * Polled by `useRegistrationPulse` rather than pushed over Supabase Realtime — a socket would mean
 * adding `registrations` to the `supabase_realtime` publication and streaming rows of attendee data
 * to every subscriber, which is a wider surface than this needs (AGENTS.md §14). Admin-guarded like
 * every other admin read; the response carries no phone, email, or guardian data.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isEntityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const repository = await createAdminRegistrationRepository();
  const outcome = await repository.pulseForEvent(id);
  if (!outcome.ok) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  return NextResponse.json(outcome.data, { headers: { "cache-control": "no-store" } });
}
