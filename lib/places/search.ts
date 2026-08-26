import type { EntryPlace } from '@/lib/journal/types'

// openstreetmap's geocoder. free and keyless, but their usage policy caps it at
// roughly one request a second, so every caller debounces. if this ever needs to
// scale, swapping in a paid geocoder means rewriting only this file
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

export interface PlaceSearchOptions {
  // two letter country code to keep results inside the country being journaled
  countryCode?: string
  signal?: AbortSignal
}

export async function searchPlaces(
  query: string,
  { countryCode, signal }: PlaceSearchOptions = {},
): Promise<EntryPlace[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  const params = new URLSearchParams({
    q: trimmed,
    format: 'jsonv2',
    limit: '5',
    addressdetails: '0',
  })

  // natural earth leaves ISO_A2 as "-99" on a few countries, so only narrow the
  // search when we actually have a usable code
  const codeIsUsable = countryCode && countryCode.length === 2 && countryCode !== '-99'
  if (codeIsUsable) {
    params.set('countrycodes', countryCode.toLowerCase())
  }

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, { signal })
  if (!response.ok) {
    throw new Error(`place search failed: ${response.status}`)
  }

  const results = (await response.json()) as NominatimResult[]

  return results.map((result) => ({
    name: result.display_name,
    lat: Number(result.lat),
    lon: Number(result.lon),
  }))
}

// display_name comes back as a long comma separated trail, which is useful for
// disambiguating in the dropdown but far too long once it's chosen
export function shortPlaceName(fullName: string) {
  const parts = fullName.split(',').map((part) => part.trim())
  if (parts.length <= 2) return fullName
  return `${parts[0]}, ${parts[parts.length - 1]}`
}
