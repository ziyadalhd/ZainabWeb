# Deferred migration drafts

These SQL files are intentionally kept outside `supabase/migrations/`, so the Supabase CLI will not treat them as deployable migrations.

- `20260817120000_fix_service_request_validation.sql` and `20260817130000_relax_service_request_constraints.sql` are preserved for review. The latter invents fallback customer data and therefore conflicts with the approved request-validation rules.
- `20260819210000_allow_multiselect_event_audience.sql` is superseded. Multi-audience events were approved on `2026-09-14` and implemented by `supabase/migrations/20260914090000_add_event_audiences.sql`, which uses a `text[]` column instead of this draft's comma-separated string.
- `20260914090001_drop_event_audience.sql` is step 2 of that change, held here on purpose. Promote it to `supabase/migrations/` and apply it only once the multi-audience build is confirmed live; until then the deployed code still reads `events.audience`.

They must not be applied to development or production without an explicit product decision and a reviewed forward migration.
