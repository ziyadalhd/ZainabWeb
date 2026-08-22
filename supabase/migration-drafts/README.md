# Deferred migration drafts

These SQL files are intentionally kept outside `supabase/migrations/`, so the Supabase CLI will not treat them as deployable migrations.

- `20260817120000_fix_service_request_validation.sql` and `20260817130000_relax_service_request_constraints.sql` are preserved for review. The latter invents fallback customer data and therefore conflicts with the approved request-validation rules.
- `20260819210000_allow_multiselect_event_audience.sql` is preserved for review. It conflicts with the approved single audience model and fixed audience boundaries.

They must not be applied to development or production without an explicit product decision and a reviewed forward migration.
