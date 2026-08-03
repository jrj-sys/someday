'use client'

import { useEffect, useMemo, useState } from 'react'
import GlobeLazy from '@/components/GlobeLazy'
import { useProfile } from '@/components/ProfileProvider'
import { countryId, fetchWorld, type CountryFeature, type World } from '@/lib/data/world'
import styles from './globe.module.css'

export default function GlobeShell() {
  const { profile } = useProfile()
  const [world, setWorld] = useState<World | null>(null)
  const [selected, setSelected] = useState<CountryFeature | null>(null)

  useEffect(() => {
    fetchWorld().then(setWorld).catch(console.error)
  }, [])

  // this is the whole point of "see my globe" 
  const visited = useMemo(() => new Set(profile?.visited ?? []), [profile])

  const toggle = (country: CountryFeature) => {
    setSelected((prev) => (prev && countryId(prev) === countryId(country) ? null : country))
  }

  return (
    <div className={styles.stage}>
      {selected && <div className={styles.selectedBadge}>{selected.properties.ADMIN}</div>}

      {/* recommended stays empty until phase 3 has real scores to hand it */}
      <GlobeLazy
        world={world}
        visited={visited}
        selectedId={selected ? countryId(selected) : null}
        onCountryClick={toggle}
        flyToOnClick
      />
    </div>
  )
}
