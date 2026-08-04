import { ACTIVITIES, type Profile } from '@/lib/profile/types'
import type { CountryData, Reason, ScoredCountry } from './types'

// "fit first" -- what you like to do carries the most weight, an explicit dream
// is a strong nudge but can't carry a bad match on its own, and novelty only
// breaks ties. tuning these numbers *is* tuning the product's opinion
export const WEIGHTS = {
  activity: 40,
  dream: 25,
  climate: 15,
  budget: 12,
  novelty: 8,
}

const TOTAL_WEIGHT =
  WEIGHTS.activity + WEIGHTS.dream + WEIGHTS.climate + WEIGHTS.budget + WEIGHTS.novelty

// advisories multiply the whole score rather than subtracting from it. a level
// 4 shouldn't be winnable no matter how perfect the fit is
const ADVISORY_MULTIPLIER: Record<number, number> = {
  1: 1,
  2: 0.92,
  3: 0.55,
  4: 0.2,
}

// the most expensive cost tier each budget is comfortable with
const BUDGET_CEILING = {
  shoestring: 1,
  comfortable: 2,
  luxury: 3,
}

const ACTIVITY_LABELS = new Map(
  ACTIVITIES.map((activity) => [activity.id, activity.label.toLowerCase()]),
)

// "beaches", "beaches and food & drink", "beaches, food & drink and nightlife"
function listPhrase(phrases: string[]) {
  if (phrases.length === 0) return ''
  if (phrases.length === 1) return phrases[0]

  const allButLast = phrases.slice(0, -1)
  const last = phrases[phrases.length - 1]
  return `${allButLast.join(', ')} and ${last}`
}

// country id -> region. novelty needs it to tell which regions you have already
// seen. passed in rather than looked up globally so scoring stays a pure
// function of its arguments
export type RegionLookup = Map<string, string>

// how well the country covers the things you said you like, 0 to 1
function rateActivities(profile: Profile, country: CountryData) {
  if (profile.activities.length === 0) return 0

  const matched = profile.activities.filter((activity) => country.activities.includes(activity))
  return matched.length / profile.activities.length
}

// 1 when the weather suits you. a miss isn't fatal, hence 0.25 rather than 0
function rateClimate(profile: Profile, country: CountryData) {
  if (profile.climate === 'any') return 1
  if (country.climates.includes(profile.climate)) return 1
  return 0.25
}

// being cheaper than you can afford is never a problem, being more expensive is
function rateBudget(profile: Profile, country: CountryData) {
  const ceiling = BUDGET_CEILING[profile.budget]
  const tiersOverBudget = country.cost - ceiling

  if (tiersOverBudget <= 0) return 1
  if (tiersOverBudget === 1) return 0.4
  return 0.1
}

// novelty by region rather than by country -- a fifth trip to western europe is
// less of a discovery than a first trip to south america
function countVisitsInRegion(profile: Profile, country: CountryData, regions: RegionLookup) {
  const otherVisits = profile.visited.filter((visitedId) => visitedId !== country.id)
  return otherVisits.filter((visitedId) => regions.get(visitedId) === country.region).length
}

function rateNovelty(visitsInRegion: number) {
  if (visitsInRegion === 0) return 1
  if (visitsInRegion === 1) return 0.5
  return 0.2
}

export function scoreCountry(
  profile: Profile,
  country: CountryData,
  regions: RegionLookup = new Map(),
): ScoredCountry {
  const reasons: Reason[] = []
  let points = 0

  // --- what you like doing, the heaviest factor
  const activityFit = rateActivities(profile, country)
  points += activityFit * WEIGHTS.activity

  const matchedActivities = profile.activities.filter((activity) =>
    country.activities.includes(activity),
  )
  if (matchedActivities.length > 0) {
    const labels = matchedActivities.map((activity) => ACTIVITY_LABELS.get(activity) ?? activity)
    reasons.push({
      kind: 'activity',
      text: `Good for ${listPhrase(labels)}`,
      positive: true,
      weight: activityFit * WEIGHTS.activity,
    })
  }

  // --- explicitly on the wish list
  const isDreamDestination = profile.dreams.includes(country.id)
  if (isDreamDestination) {
    points += WEIGHTS.dream
    reasons.push({
      kind: 'dream',
      text: 'On your dream list',
      positive: true,
      weight: WEIGHTS.dream,
    })
  }

  // --- weather. 'any' means the question shouldn't sway anything, so everyone
  // gets full marks and nobody gets a reason line about it
  const climateFit = rateClimate(profile, country)
  points += climateFit * WEIGHTS.climate

  if (profile.climate !== 'any') {
    const weatherSuitsYou = climateFit === 1
    if (weatherSuitsYou) {
      reasons.push({
        kind: 'climate',
        text: `${profile.climate} weather, the kind you like`,
        positive: true,
        weight: WEIGHTS.climate,
      })
    } else {
      reasons.push({
        kind: 'climate',
        text: `Not really a ${profile.climate} weather country`,
        positive: false,
        weight: WEIGHTS.climate * 0.75,
      })
    }
  }

  // --- money
  const budgetFit = rateBudget(profile, country)
  points += budgetFit * WEIGHTS.budget

  const ceiling = BUDGET_CEILING[profile.budget]
  if (country.cost > ceiling) {
    reasons.push({
      kind: 'budget',
      text: 'Pricier than your usual trip',
      positive: false,
      weight: WEIGHTS.budget * (1 - budgetFit),
    })
  } else if (country.cost < ceiling) {
    reasons.push({
      kind: 'budget',
      text: 'Easy on your budget',
      positive: true,
      weight: WEIGHTS.budget * 0.5,
    })
  }

  // --- somewhere new
  const visitsInRegion = countVisitsInRegion(profile, country, regions)
  const noveltyFit = rateNovelty(visitsInRegion)
  points += noveltyFit * WEIGHTS.novelty

  if (visitsInRegion === 0) {
    reasons.push({
      kind: 'novelty',
      text: `You haven't been to ${country.region} yet`,
      positive: true,
      weight: WEIGHTS.novelty,
    })
  }

  // --- safety, applied last because it scales everything above it
  const safetyMultiplier = ADVISORY_MULTIPLIER[country.advisory] ?? 1
  const score = (points / TOTAL_WEIGHT) * safetyMultiplier

  const hasSeriousAdvisory = country.advisory >= 3
  if (hasSeriousAdvisory) {
    reasons.push({
      kind: 'safety',
      text: `Currently a level ${country.advisory} travel advisory`,
      positive: false,
      // scaled to sit near the top of the list, a bad advisory is the first
      // thing you should read
      weight: (1 - safetyMultiplier) * 100,
    })
  }

  const strongestFirst = reasons.sort((left, right) => right.weight - left.weight)
  return { country, score, reasons: strongestFirst }
}

export function buildRegionLookup(countries: CountryData[]): RegionLookup {
  return new Map(countries.map((country) => [country.id, country.region]))
}

export function recommend(
  profile: Profile,
  countries: CountryData[],
  { limit = 10 }: { limit?: number } = {},
): ScoredCountry[] {
  const regions = buildRegionLookup(countries)
  const alreadyVisited = new Set(profile.visited)

  const candidates = countries.filter((country) => !alreadyVisited.has(country.id))
  const scored = candidates.map((country) => scoreCountry(profile, country, regions))

  scored.sort((left, right) => {
    const scoreDifference = right.score - left.score
    if (scoreDifference !== 0) return scoreDifference
    // name as a tiebreak so the order never wobbles between renders
    return left.country.name.localeCompare(right.country.name)
  })

  return scored.slice(0, limit)
}
