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

export default function CountryPicker({ world, value, onChange }: CountryPickerProps) {
  const [query, setQuery] = useState('')

  // set for the globe's o(1) lookups per polygon per frame, array stays the
  // source of truth so the saved profile has a stable order
  const selected = useMemo(() => new Set(value), [value])

  const byId = useMemo(() => {
    const map = new Map<string, CountryFeature>()
    for (const f of world?.features ?? []) map.set(countryId(f), f)
    return map
  }, [world])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return (world?.features ?? [])
      .filter((f) => f.properties.ADMIN.toLowerCase().includes(q))
      .slice(0, 6)
  }, [query, world])

  const toggle = (country: CountryFeature) => {
    const id = countryId(country)
    onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  return (
    <div className={styles.picker}>
      <div className={styles.controls}>
        <input
          className={styles.search}
          type="text"
          value={query}
          placeholder="Search for a country"
          onChange={(e) => setQuery(e.target.value)}
        />
        {matches.length > 0 && (
          <ul className={styles.results}>
            {matches.map((f) => {
              const id = countryId(f)
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      toggle(f)
                      setQuery('')
                    }}
                  >
                    <span>{f.properties.ADMIN}</span>
                    {selected.has(id) && <span className={styles.tick}>remove</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className={styles.chips}>
          {value.length === 0 && <p className={styles.empty}>nothing picked yet</p>}
          {value.map((id) => (
            <button
              key={id}
              type="button"
              className={styles.chip}
              onClick={() => onChange(value.filter((v) => v !== id))}
            >
              {byId.get(id)?.properties.ADMIN ?? id}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.globe}>
        {/* picked countries borrow the "visited" paint, it's the same idea */}
        <GlobeLazy world={world} visited={selected} onCountryClick={toggle} />
      </div>
    </div>
  )
}
