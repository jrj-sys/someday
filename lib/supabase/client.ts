import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// the app has to keep working before anyone sets up supabase, so everything
// auth related checks this first and falls back to localStorage only
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let client: SupabaseClient | null = null

// one client for the whole tab. making a fresh one per call would spawn a new
// auth listener each time and they'd fight over the session
export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // pkce keeps the tokens out of the url, the callback page trades the
        // short lived code for a real session
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return client
}
