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
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<CountryFeature | null>(null)

  // react-globe.gl wants explicit pixel dimensions, so measure the wrapper div
  // and re-measure on window resize
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const measure = () => {
      if (wrapRef.current) {
        setSize({ w: wrapRef.current.clientWidth, h: wrapRef.current.clientHeight })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
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

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      {size.w > 0 && (
        <Globe
          ref={globeRef}
          width={size.w}
          height={size.h}
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
          polygonAltitude={(f) => {
            const id = countryId(f as CountryFeature)
            if (id === selectedId) return 0.03
            const score = recommended.get(id)
            // stronger recommendations sit higher off the surface
            if (score !== undefined && !visited.has(id)) return 0.008 + score * 0.022
            return 0.005
          }}
          polygonCapColor={(f) => {
            const feature = f as CountryFeature
            const id = countryId(feature)
            // been there wins over go there, you can't be recommended a place
            // you've already ticked off
            if (visited.has(id)) return colors.visited
            const score = recommended.get(id)
            if (score !== undefined) return mix(colors.recLow, colors.recHigh, score)
            return feature === hovered ? colors.hover : colors.base
          }}
          polygonSideColor={() => colors.landEdge}
          polygonStrokeColor={(f) =>
            countryId(f as CountryFeature) === selectedId ? colors.selectedStroke : colors.stroke
          }
          polygonLabel={(f) => {
            const c = f as CountryFeature
            const id = countryId(c)
            const note = visited.has(id) ? ' · visited' : ''
            return `<div class="globe-tooltip">${c.properties.ADMIN}${note}</div>`
          }}
          onPolygonHover={(f) => setHovered((f as CountryFeature) ?? null)}
          onPolygonClick={(f, _event, coords) => handleClick(f as CountryFeature, coords)}
          polygonsTransitionDuration={200}
        />
      )}
    </div>
  )
}
