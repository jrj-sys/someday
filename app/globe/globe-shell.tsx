'use client'

import { useEffect, useMemo, useState } from 'react'
import CountryPanel from '@/components/CountryPanel'
import GlobeLazy from '@/components/GlobeLazy'
import { useProfile } from '@/components/ProfileProvider'
import countriesJson from '@/data/countries.json'
import { countryId, fetchWorld, type CountryFeature, type World } from '@/lib/data/world'
import { recommend } from '@/lib/recommend/score'
import type { CountryData, ScoredCountry } from '@/lib/recommend/types'
import styles from './globe.module.css'

const COUNTRIES = countriesJson as CountryData[]

// how many countries actually glow on the globe
const HOW_MANY_GLOW = 10

// the dimmest a recommendation is allowed to glow. without a floor the weakest
// of the ten fades into the plain sand countries and looks like a mistake
const DIMMEST_GLOW = 0.25

export default function GlobeShell() {
  const { profile } = useProfile()
  const [world, setWorld] = useState<World | null>(null)
  const [selected, setSelected] = useState<CountryFeature | null>(null)

  useEffect(() => {
    fetchWorld().then(setWorld).catch(console.error)
  }, [])

  // this is the whole point of "see my globe"
  const visited = useMemo(() => new Set(profile?.visited ?? []), [profile])

  // score everything, not just the top ten, so clicking any country can still
  // explain itself in the panel
  const scoredByCountryId = useMemo(() => {
    const lookup = new Map<string, ScoredCountry>()
    if (!profile) return lookup

    const everywhere = recommend(profile, COUNTRIES, { limit: COUNTRIES.length })
    for (const scoredCountry of everywhere) {
      lookup.set(scoredCountry.country.id, scoredCountry)
    }
    return lookup
  }, [profile])

  const topRecommendations = useMemo(() => {
    if (!profile) return []
    return recommend(profile, COUNTRIES, { limit: HOW_MANY_GLOW })
  }, [profile])

  // spread the top ten across the amber range so the best one is clearly the
  // brightest, rather than all ten sitting at the same heat
  const glowByCountryId = useMemo(() => {
    const glow = new Map<string, number>()
    if (topRecommendations.length === 0) return glow

    const bestScore = topRecommendations[0].score
    const worstScore = topRecommendations[topRecommendations.length - 1].score

    // guard against every recommendation tying, which would divide by zero
    const scoreRange = bestScore - worstScore || 1

    for (const recommendation of topRecommendations) {
      const positionInRange = (recommendation.score - worstScore) / scoreRange
      const brightness = DIMMEST_GLOW + (1 - DIMMEST_GLOW) * positionInRange
      glow.set(recommendation.country.id, brightness)
    }
    return glow
  }, [topRecommendations])

  const selectedId = selected ? countryId(selected) : null

  function rankOf(id: string | null) {
    if (!id) return null
    const index = topRecommendations.findIndex((recommendation) => recommendation.country.id === id)
    if (index === -1) return null
    return index + 1
  }

  function toggleSelected(country: CountryFeature) {
    setSelected((previous) => {
      const clickedTheSameOne = previous && countryId(previous) === countryId(country)
      if (clickedTheSameOne) return null
      return country
    })
  }

  return (
    <div className={styles.stage}>
      <GlobeLazy
        world={world}
        visited={visited}
        recommended={glowByCountryId}
        selectedId={selectedId}
        onCountryClick={toggleSelected}
        flyToOnClick
      />

      {selected && selectedId && (
        <CountryPanel
          name={selected.properties.ADMIN}
          visited={visited.has(selectedId)}
          scored={scoredByCountryId.get(selectedId) ?? null}
          rank={rankOf(selectedId)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
