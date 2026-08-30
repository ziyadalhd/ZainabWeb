import { cache } from "react";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";

/**
 * Request-scoped list loaders.
 *
 * Wrapped in React's `cache` so two Suspense boundaries on the same page — the hub body and the
 * calendar overlay, for instance — can each fetch what they need independently without the page
 * paying for the same query twice. Splitting a page into streamable regions otherwise trades one
 * waterfall for duplicated work; this makes the split free.
 */
export const listAdminEvents = cache(async () => (await createAdminEventRepository()).list());

export const listAdminServiceRequests = cache(async () => (await createAdminServiceRequestRepository()).list());

export const listAdminRegistrations = cache(async () => (await createAdminRegistrationRepository()).list());
