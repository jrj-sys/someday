# lib/recommend — the recommendation engine

This will be the heart of the app: pure TypeScript functions that score every
country against your travel profile.

Planned shape (built in Phase 3):

```ts
score(profile: Profile, country: CountryData): { score: number; reasons: Reason[] }
```

Pure functions only — no React, no fetch, no globals — so it's trivially
unit-testable with Vitest (`npm test`).

Empty until Phase 3.
