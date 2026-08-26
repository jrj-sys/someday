// a place from the picker. lat/lon are kept so entries can become pins on the
// globe later without re-geocoding anything
export interface EntryPlace {
  name: string
  lat: number
  lon: number
}

export interface JournalPhoto {
  id: string
  storagePath: string
}

export interface JournalEntry {
  id: string
  countryId: string
  // null when the entry is about the country generally
  place: EntryPlace | null
  happenedOn: string // yyyy-mm-dd
  body: string
  createdAt: string
  photos: JournalPhoto[]
}

// what the composer hands back, before the database gives it an id
export interface DraftEntry {
  countryId: string
  place: EntryPlace | null
  happenedOn: string
  body: string
}
