// the profile is the recommendation engine's entire input, so this file is
// effectively the app's core data model. phase 3 will score countries against it

export type ActivityId =
  'beaches' | 'hiking' | 'food' | 'nightlife' | 'culture' | 'wildlife' | 'cities' | 'adventure'

export type ClimateId = 'hot' | 'mild' | 'cold' | 'any'
export type BudgetId = 'shoestring' | 'comfortable' | 'luxury'

export interface Profile {
  activities: ActivityId[]
  climate: ClimateId
  budget: BudgetId
  visited: string[] // country ids, see countryId() in lib/data/world
  dreams: string[]
  updatedAt: string
}

// option lists live next to the types so the wizard and the scoring engine
// can never drift apart on what a valid value is
export const ACTIVITIES: { id: ActivityId; label: string; emoji: string }[] = [
  { id: 'beaches', label: 'Beaches', emoji: '🏝️' },
  { id: 'hiking', label: 'Hiking & nature', emoji: '🥾' },
  { id: 'food', label: 'Food & drink', emoji: '🍜' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🍸' },
  { id: 'culture', label: 'History & culture', emoji: '🏛️' },
  { id: 'wildlife', label: 'Wildlife', emoji: '🐘' },
  { id: 'cities', label: 'City life', emoji: '🌆' },
  { id: 'adventure', label: 'Adventure sports', emoji: '🏄' },
]

export const CLIMATES: { id: ClimateId; label: string; hint: string }[] = [
  { id: 'hot', label: 'Hot', hint: 'tropics, deserts, endless summer' },
  { id: 'mild', label: 'Mild', hint: 'spring jacket weather' },
  { id: 'cold', label: 'Cold', hint: 'snow, northern lights, fjords' },
  { id: 'any', label: 'Any', hint: "weather won't decide it for me" },
]

export const BUDGETS: { id: BudgetId; label: string; hint: string }[] = [
  { id: 'shoestring', label: 'Shoestring', hint: 'hostels, street food, buses' },
  { id: 'comfortable', label: 'Comfortable', hint: 'decent hotels, the odd splurge' },
  { id: 'luxury', label: 'Luxury', hint: 'if it is worth it, it is worth it' },
]

export function emptyProfile(): Profile {
  // 'any' climate and a comfortable budget mean an untouched profile doesn't
  // secretly express a preference nobody chose
  return {
    activities: [],
    climate: 'any',
    budget: 'comfortable',
    visited: [],
    dreams: [],
    updatedAt: new Date().toISOString(),
  }
}
