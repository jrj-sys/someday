'use client'

import { useMemo, useState } from 'react'
import GlobeLazy from '@/components/GlobeLazy'
import { countryId, type CountryFeature, type World } from '@/lib/data/world'
import styles from './CountryPicker.module.css'

interface CountryPickerProps {
  world: World | null
  value: string[]
  onChange: (ids: string[]) => void
}

const MAX_SEARCH_RESULTS = 6

export default function CountryPicker({ world, value, onChange }: CountryPickerProps) {
  const [query, setQuery] = useState('')

  // set for the globe's o(1) lookups per polygon per frame, the array stays the
  // source of truth so the saved profile has a stable order
  const selected = useMemo(() => new Set(value), [value])

  const featuresByCountryId = useMemo(() => {
    const lookup = new Map<string, CountryFeature>()
    for (const feature of world?.features ?? []) {
      lookup.set(countryId(feature), feature)
    }
    return lookup
  }, [world])

  const searchResults = useMemo(() => {
    const searchTerm = query.trim().toLowerCase()
    if (searchTerm === '') return []

    const allFeatures = world?.features ?? []
    const nameMatches = allFeatures.filter((feature) =>
      feature.properties.ADMIN.toLowerCase().includes(searchTerm),
    )
    return nameMatches.slice(0, MAX_SEARCH_RESULTS)
  }, [query, world])

  function toggleCountry(country: CountryFeature) {
    const id = countryId(country)

    if (selected.has(id)) {
      const withoutThisOne = value.filter((selectedId) => selectedId !== id)
      onChange(withoutThisOne)
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className={styles.picker}>
      <div className={styles.controls}>
        <input
          className={styles.search}
          type="text"
          value={query}
          placeholder="Search for a country"
          onChange={(event) => setQuery(event.target.value)}
        />
        {searchResults.length > 0 && (
          <ul className={styles.results}>
            {searchResults.map((feature) => {
              const id = countryId(feature)
              const alreadyPicked = selected.has(id)

              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      toggleCountry(feature)
                      setQuery('')
                    }}
                  >
                    <span>{feature.properties.ADMIN}</span>
                    {alreadyPicked && <span className={styles.tick}>remove</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className={styles.chips}>
          {value.length === 0 && <p className={styles.empty}>nothing picked yet</p>}
          {value.map((id) => {
            const feature = featuresByCountryId.get(id)
            const name = feature?.properties.ADMIN ?? id

            function removeThisCountry() {
              onChange(value.filter((selectedId) => selectedId !== id))
            }

            return (
              <button key={id} type="button" className={styles.chip} onClick={removeThisCountry}>
                {name}
                <span aria-hidden>×</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.globe}>
        {/* picked countries borrow the "visited" paint, it's the same idea */}
        <GlobeLazy world={world} visited={selected} onCountryClick={toggleCountry} />
      </div>
    </div>
  )
}
