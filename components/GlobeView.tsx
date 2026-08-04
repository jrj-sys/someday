'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Globe, { GlobeMethods } from 'react-globe.gl'
import { MeshPhongMaterial } from 'three'
import { countryId, type CountryFeature, type World } from '@/lib/data/world'
import { GLOBE_COLORS as colors, mix } from '@/lib/globe/schemes'

interface GlobeViewProps {
  world: World | null
  // everywhere you've been, from the saved profile
  visited?: Set<string>
  // country id -> score between 0 and 1. phase 3 fills this in
  recommended?: Map<string, number>
  selectedId?: string | null
  onCountryClick?: (country: CountryFeature) => void
  flyToOnClick?: boolean
}

const NO_VISITS: Set<string> = new Set()
const NO_RECS: Map<string, number> = new Map()

export default function GlobeView({
  world,
  visited = NO_VISITS,
  recommended = NO_RECS,
  selectedId = null,
  onCountryClick,
  flyToOnClick = false,
}: GlobeViewProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<CountryFeature | null>(null)

  // react-globe.gl wants explicit pixel dimensions, so measure the wrapper div
  // and re-measure on window resize
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    function measureWrapper() {
      if (!wrapperRef.current) return
      setSize({
        width: wrapperRef.current.clientWidth,
        height: wrapperRef.current.clientHeight,
      })
    }

    measureWrapper()
    window.addEventListener('resize', measureWrapper)
    return () => window.removeEventListener('resize', measureWrapper)
  }, [])

  const oceanMaterial = useMemo(() => new MeshPhongMaterial({ color: colors.ocean }), [])

  // slow idle spin. dragging pauses it (orbit controls do that themselves) and
  // we pause on hover too so it holds still while you're aiming at a country
  useEffect(() => {
    const controls = globeRef.current?.controls()
    if (controls) {
      controls.autoRotate = !hovered
      controls.autoRotateSpeed = 0.5
    }
  }, [hovered])

  const countries = world?.features ?? []

  const handleClick = (feature: CountryFeature, coords: { lat: number; lng: number }) => {
    onCountryClick?.(feature)
    if (flyToOnClick) {
      // fly toward where they clicked instead of computing real centroids.
      // 1.8 keeps the sphere's curve in frame, closer loses the globe feeling
      globeRef.current?.pointOfView({ lat: coords.lat, lng: coords.lng, altitude: 1.8 }, 800)
    }
  }

  // how far a country floats off the sphere. selection lifts most, then
  // recommendations by strength, everything else sits flat
  function altitudeFor(feature: CountryFeature) {
    const id = countryId(feature)
    if (id === selectedId) return 0.03

    const recommendationScore = recommended.get(id)
    const isUnvisitedRecommendation = recommendationScore !== undefined && !visited.has(id)
    if (isUnvisitedRecommendation) return 0.008 + recommendationScore * 0.022

    return 0.005
  }

  function fillColorFor(feature: CountryFeature) {
    const id = countryId(feature)

    // been there wins over go there, you can't be recommended a place you have
    // already ticked off
    if (visited.has(id)) return colors.visited

    const recommendationScore = recommended.get(id)
    if (recommendationScore !== undefined) {
      return mix(colors.recLow, colors.recHigh, recommendationScore)
    }

    if (feature === hovered) return colors.hover
    return colors.base
  }

  function tooltipFor(feature: CountryFeature) {
    const hasBeenThere = visited.has(countryId(feature))
    const note = hasBeenThere ? ' · visited' : ''
    return `<div class="globe-tooltip">${feature.properties.ADMIN}${note}</div>`
  }

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      {size.width > 0 && (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={oceanMaterial}
          globeImageUrl={null}
          atmosphereColor="#8ed3f4"
          onGlobeReady={() => {
            const controls = globeRef.current?.controls()
            if (controls) {
              controls.autoRotate = true
              controls.autoRotateSpeed = 0.5
            }
          }}
          polygonsData={countries}
          polygonAltitude={(polygon) => altitudeFor(polygon as CountryFeature)}
          polygonCapColor={(polygon) => fillColorFor(polygon as CountryFeature)}
          polygonSideColor={() => colors.landEdge}
          polygonStrokeColor={(polygon) => {
            const isSelected = countryId(polygon as CountryFeature) === selectedId
            if (isSelected) return colors.selectedStroke
            return colors.stroke
          }}
          polygonLabel={(polygon) => tooltipFor(polygon as CountryFeature)}
          onPolygonHover={(polygon) => setHovered((polygon as CountryFeature) ?? null)}
          onPolygonClick={(polygon, _event, coords) =>
            handleClick(polygon as CountryFeature, coords)
          }
          polygonsTransitionDuration={200}
        />
      )}
    </div>
  )
}
