# data — curated datasets

- `countries.json` (arrives in Phase 3): curated attributes per country —
  region, climate, activity tags, cost tier, travel-advisory level, languages,
  best seasons. This is what the recommendation engine will score against.
- Country _polygons_ for the globe live in `public/data/world.geojson`
  (served as a static asset, fetched at runtime — see `lib/data/world.ts`).

Countries are joined across datasets by ISO 3166-1 alpha-3 code such as `USA`
