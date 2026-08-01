import type { FeatureCollection, Geometry } from "geojson";

/**
 * Properties present on each country feature in public/data/world.geojson
 * (Natural Earth 110m admin-0 countries). There are many more fields in the
 * raw file; these are the ones we care about.
 */
export interface CountryProperties {
  /** Full country name, e.g. "United States of America" */
  ADMIN: string;
  /** ISO 3166-1 alpha-2 code, e.g. "US" (a few disputed areas use "-99") */
  ISO_A2: string;
  /** ISO 3166-1 alpha-3 code, e.g. "USA" */
  ISO_A3: string;
  /** Continent name, e.g. "North America" */
  CONTINENT: string;
  /** Rough population estimate */
  POP_EST: number;
}

export type World = FeatureCollection<Geometry, CountryProperties>;

/**
 * Fetch the country polygons. Client-side only (the globe is client-only anyway).
 * The file lives in public/ so it's served as a static asset instead of being
 * bundled into the JavaScript.
 */
export async function fetchWorld(): Promise<World> {
  const res = await fetch("/data/world.geojson");
  if (!res.ok) {
    throw new Error(`Failed to load world.geojson: ${res.status}`);
  }
  return res.json();
}
