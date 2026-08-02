'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { fetchWorld, type CountryFeature, type World } from '@/lib/data/world'
import styles from './globe.module.css'

// react-globe.gl touches window at import time so it can never be rendered on
// the server -- ssr:false keeps next from even trying
const GlobeView = dynamic(() => import('@/components/GlobeView'), {
  ssr: false,
  loading: () => <p className={styles.loading}>loading the world...</p>,
})

export default function GlobeShell() {
  const [world, setWorld] = useState<World | null>(null)
  const [selected, setSelected] = useState<CountryFeature | null>(null)

  useEffect(() => {
    fetchWorld().then(setWorld).catch(console.error)
  }, [])

  return (
    <div className={styles.stage}>
      {/* stub until we decide what selecting a country actually opens */}
      {selected && <div className={styles.selectedBadge}>{selected.properties.ADMIN}</div>}
      <GlobeView world={world} onCountrySelect={setSelected} />
    </div>
  )
}