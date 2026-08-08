# lib/supabase — supabase client helpers

- `client.ts` — one browser client per tab, plus `isSupabaseConfigured`. every
  auth path checks that flag so the app still runs with no keys set.
- `profiles.ts` — the only place that knows both the postgres column names and
  the app's `Profile` type.

schema and row level security live in `supabase/migrations/`. setup steps are in
`docs/walkthroughs/phase-4.md`, config template is `.env.local.example`.
