import type { ActivityId, ClimateId } from '@/lib/profile/types'

export type CountryClimate = Exclude<ClimateId, 'any'>

// 1 cheap, 2 middling, 3 expensive
export type CostTier = 1 | 2 | 3

// us state department style. 1 normal precautions, 4 do not travel
export type AdvisoryLevel = 1 | 2 | 3 | 4

export interface CountryData {
  // matches countryId() from lib/data/world, which is ISO_A3 except for the
  // handful natural earth leaves as "-99" (france, norway...) where it's the name
  id: string
  name: string
  region: string
  activities: ActivityId[]
  climates: CountryClimate[]
  cost: CostTier
  advisory: AdvisoryLevel
}

export type ReasonKind = 'activity' | 'dream' | 'climate' | 'budget' | 'novelty' | 'safety'

export interface Reason {
  kind: ReasonKind
  text: string
  positive: boolean
  // how much this pushed the score around, used to rank the list
  weight: number
}

export interface ScoredCountry {
  country: CountryData
  score: number // 0..1
  reasons: Reason[] // strongest first
}
