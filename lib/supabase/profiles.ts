import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityId, BudgetId, ClimateId, Profile } from '@/lib/profile/types'

// postgres hands back snake_case columns and plain strings, the app wants the
// Profile type. this file is the only place that knows about both
interface ProfileRow {
  user_id: string
  activities: string[]
  climate: string
  budget: string
  visited: string[]
  dreams: string[]
  updated_at: string
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    activities: row.activities as ActivityId[],
    climate: row.climate as ClimateId,
    budget: row.budget as BudgetId,
    visited: row.visited,
    dreams: row.dreams,
    updatedAt: row.updated_at,
  }
}

export async function fetchCloudProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('could not load profile from supabase', error)
    return null
  }

  if (!data) return null
  return rowToProfile(data as ProfileRow)
}

export async function saveCloudProfile(
  supabase: SupabaseClient,
  userId: string,
  profile: Profile,
): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    activities: profile.activities,
    climate: profile.climate,
    budget: profile.budget,
    visited: profile.visited,
    dreams: profile.dreams,
    updated_at: profile.updatedAt,
  })

  if (error) {
    console.error('could not save profile to supabase', error)
  }
}
