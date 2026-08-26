'use client'

import { useEffect, useState } from 'react'
import type { EntryPlace } from '@/lib/journal/types'
import { searchPlaces, shortPlaceName } from '@/lib/places/search'
import styles from './PlacePicker.module.css'

interface PlacePickerProps {
  countryCode?: string
  value: EntryPlace | null
  onChange: (place: EntryPlace | null) => void
}

// nominatim asks for no more than a request a second, so wait until the typing
// stops rather than firing on every keystroke
const TYPING_PAUSE_MS = 700

export default function PlacePicker({ countryCode, value, onChange }: PlacePickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<EntryPlace[]>([])
  const [searching, setSearching] = useState(false)

  const trimmedQuery = query.trim()
  const queryIsLongEnough = trimmedQuery.length >= 3

  useEffect(() => {
    if (!queryIsLongEnough) return

    // abort on every change so a slow earlier search can't land after a newer
    // one and overwrite the results
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setSearching(true)
      searchPlaces(trimmedQuery, { countryCode, signal: controller.signal })
        .then((found) => {
          setResults(found)
          setSearching(false)
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.error(error)
            setSearching(false)
          }
        })
    }, TYPING_PAUSE_MS)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [trimmedQuery, queryIsLongEnough, countryCode])

  // hiding stale results is a render decision, not something worth clearing
  // state from inside an effect for
  const visibleResults = queryIsLongEnough ? results : []

  if (value) {
    return (
      <div className={styles.chosen}>
        <span>{shortPlaceName(value.name)}</span>
        <button type="button" onClick={() => onChange(null)} aria-label="Clear place">
          ×
        </button>
      </div>
    )
  }

  return (
    <div className={styles.picker}>
      <input
        className={styles.input}
        type="text"
        value={query}
        placeholder="Where exactly? (optional)"
        onChange={(event) => setQuery(event.target.value)}
      />

      {searching && <p className={styles.hint}>looking...</p>}

      {visibleResults.length > 0 && (
        <ul className={styles.results}>
          {visibleResults.map((place) => (
            <li key={`${place.lat},${place.lon}`}>
              <button
                type="button"
                onClick={() => {
                  onChange(place)
                  setQuery('')
                  setResults([])
                }}
              >
                {place.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
