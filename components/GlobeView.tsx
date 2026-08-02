'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Globe, { GlobeMethods } from 'react-globe.gl'
import { MeshPhongMaterial } from 'three'
import type { CountryFeature, World } from '@/lib/data/world'

interface GlobeViewProps {
  world: World | null
  onCountrySelect?: (country: CountryFeature | null) => void
}

// brand colors -- ocean sphere, sand land, sun for hover, sunset for selected
const OCEAN = '#2e86c1'
const SAND = '#fdeecd'
const SUN = '#ffd166'
const SUNSET = '#ff9f45'
const LAND_EDGE = 'rgba(27, 73, 101, 0.4)'

export default function GlobeView({ world, onCountrySelect }: GlobeViewProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<CountryFeature | null>(null)
  const [selected, setSelected] = useState<CountryFeature | null>(null)

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

  const oceanMaterial = useMemo(() => new MeshPhongMaterial({ color: OCEAN }), [])

  // slow idle spin. dragging pauses it automatically (orbit controls), and we
  // also pause while a country is hovered so it holds still for clicking
  useEffect(() => {
    const controls = globeRef.current?.controls()
    if (controls) {
      controls.autoRotate = !hovered && !selected
      controls.autoRotateSpeed = 0.5
    }
  }, [hovered, selected])

  const countries = world?.features ?? []

  const handleClick = (feature: CountryFeature, coords: { lat: number; lng: number }) => {
    const next = feature === selected ? null : feature
    setSelected(next)
    onCountrySelect?.(next)
    if (next) {
      // fly toward where they clicked rather than computing true centroids,
      // close enough and free. 1.8 keeps the sphere's curve in frame
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
          polygonAltitude={(f) => (f === selected ? 0.02 : 0.005)}
          polygonCapColor={(f) => (f === selected ? SUNSET : f === hovered ? SUN : SAND)}
          polygonSideColor={() => LAND_EDGE}
          polygonStrokeColor={() => OCEAN}
          polygonLabel={(f) => {
            const c = f as CountryFeature
            return `<div class="globe-tooltip">${c.properties.ADMIN}</div>`
          }}
          onPolygonHover={(f) => setHovered((f as CountryFeature) ?? null)}
          onPolygonClick={(f, _event, coords) => handleClick(f as CountryFeature, coords)}
          polygonsTransitionDuration={200}
        />
      )}
    </div>
  )
}
