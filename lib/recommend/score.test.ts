import { describe, it, expect } from 'vitest'
import countries from '@/data/countries.json'
import { emptyProfile, type Profile } from '@/lib/profile/types'
import { buildRegionLookup, recommend, scoreCountry } from './score'
import type { CountryData } from './types'

const ALL_COUNTRIES = countries as CountryData[]
const regions = buildRegionLookup(ALL_COUNTRIES)

function find(id: string) {
  const match = ALL_COUNTRIES.find((country) => country.id === id)
  if (!match) throw new Error(`no country in the dataset with id ${id}`)
  return match
}

function profileOf(fields: Partial<Profile>): Profile {
  return { ...emptyProfile(), ...fields }
}

describe('scoreCountry', () => {
  it('rewards countries that match what you like doing', () => {
    const beachBum = profileOf({ activities: ['beaches'] })
    const thailand = scoreCountry(beachBum, find('THA'), regions)
    const czechia = scoreCountry(beachBum, find('CZE'), regions)
    expect(thailand.score).toBeGreaterThan(czechia.score)
  })

  it('explains itself in the reasons', () => {
    const foodie = profileOf({ activities: ['food', 'nightlife'] })
    const { reasons } = scoreCountry(foodie, find('JPN'), regions)
    const activity = reasons.find((reason) => reason.kind === 'activity')
    expect(activity?.text).toContain('food & drink')
    expect(activity?.text).toContain('nightlife')
  })

  it('boosts the dream list without letting it win on its own', () => {
    const hiker = profileOf({ activities: ['hiking'], dreams: ['THA'] })
    const thailand = scoreCountry(hiker, find('THA'), regions)
    const nepal = scoreCountry(hiker, find('NPL'), regions)
    // thailand is dreamt of but has no hiking, nepal is a real fit
    expect(thailand.reasons.some((reason) => reason.kind === 'dream')).toBe(true)
    expect(nepal.score).toBeGreaterThan(thailand.score)
  })

  it('drags down anywhere with a serious travel advisory', () => {
    const anyone = profileOf({ activities: ['beaches', 'food', 'culture'] })
    const mexico = scoreCountry(anyone, find('MEX'), regions) // level 3
    const portugal = scoreCountry(anyone, find('PRT'), regions) // level 1
    expect(mexico.score).toBeLessThan(portugal.score)
    expect(mexico.reasons[0].kind).toBe('safety')
  })

  it('penalises countries above your budget', () => {
    const broke = profileOf({ activities: ['cities'], budget: 'shoestring' })
    const { reasons } = scoreCountry(broke, find('CHE'), regions)
    expect(reasons.some((reason) => reason.kind === 'budget' && !reason.positive)).toBe(true)
  })

  it('treats an "any" climate preference as no preference at all', () => {
    const flexible = profileOf({ activities: ['hiking'], climate: 'any' })
    const { reasons } = scoreCountry(flexible, find('ISL'), regions)
    expect(reasons.some((reason) => reason.kind === 'climate')).toBe(false)
  })

  it('rewards a region you have never been to', () => {
    const base = { activities: ['hiking'] as Profile['activities'] }
    const fresh = scoreCountry(profileOf(base), find('PER'), regions)
    const beenAround = scoreCountry(
      profileOf({ ...base, visited: ['ARG', 'CHL'] }),
      find('PER'),
      regions,
    )
    expect(fresh.score).toBeGreaterThan(beenAround.score)
  })

  it('scores between 0 and 1', () => {
    const maxed = profileOf({
      activities: ['beaches', 'food', 'nightlife', 'culture'],
      climate: 'hot',
      budget: 'luxury',
      dreams: ['THA'],
    })
    const { score } = scoreCountry(maxed, find('THA'), regions)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(1)
  })
})

describe('recommend', () => {
  it('never recommends somewhere you have already been', () => {
    const profile = profileOf({
      activities: ['beaches', 'food'],
      visited: ['THA', 'VNM', 'PRT', 'ESP', 'ITA'],
    })
    const ids = recommend(profile, ALL_COUNTRIES).map((result) => result.country.id)
    for (const been of profile.visited) expect(ids).not.toContain(been)
  })

  it('returns the requested number, best first', () => {
    const profile = profileOf({ activities: ['hiking', 'wildlife'] })
    const top = recommend(profile, ALL_COUNTRIES, { limit: 5 })
    expect(top).toHaveLength(5)
    const scores = top.map((result) => result.score)
    expect([...scores].sort((left, right) => right - left)).toEqual(scores)
  })

  it('gives a beach and nightlife person somewhere tropical', () => {
    const profile = profileOf({
      activities: ['beaches', 'nightlife'],
      climate: 'hot',
      budget: 'shoestring',
    })
    const top = recommend(profile, ALL_COUNTRIES, { limit: 5 }).map((result) => result.country.id)
    expect(top).toContain('THA')
  })

  it('gives a cold weather hiker somewhere with mountains', () => {
    const profile = profileOf({
      activities: ['hiking', 'adventure'],
      climate: 'cold',
      budget: 'luxury',
    })
    const top = recommend(profile, ALL_COUNTRIES, { limit: 5 }).map((result) => result.country.id)
    expect(
      top.some((countryCode) => ['ISL', 'Norway', 'CHE', 'NPL', 'NZL'].includes(countryCode)),
    ).toBe(true)
  })

  it('is deterministic for the same profile', () => {
    const profile = profileOf({ activities: ['food', 'culture'] })
    const firstRun = recommend(profile, ALL_COUNTRIES).map((result) => result.country.id)
    const secondRun = recommend(profile, ALL_COUNTRIES).map((result) => result.country.id)
    expect(firstRun).toEqual(secondRun)
  })
})
