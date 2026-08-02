import type { Feature, FeatureCollection, Geometry } from 'geojson'

// natural earth 110m countries. the raw file has ~90 properties per country,
// these are the only ones we actually use. joined to countries.json by ISO_A3.
export interface CountryProperties {
  ADMIN: string // full name, e.g. "United States of America"
  ISO_A2: string // two letter code ("-99" on a few disputed areas, watch out)
  ISO_A3: string
  CONTINENT: string
  POP_EST: number
}

export type World = FeatureCollection<Geometry, CountryProperties>
export type CountryFeature = Feature<Geometry, CountryProperties>

// lives in public/ so the ~480kb of coordinates gets served as a static asset
// instead of ending up in the js bundle. client-side only, which is fine --
// the globe can't render on the server anyway
export async function fetchWorld(): Promise<World> {
  const res = await fetch('/data/world.geojson')
  if (!res.ok) {
    throw new Error(`failed to load world.geojson: ${res.status}`)
  }
  return res.json()
}
