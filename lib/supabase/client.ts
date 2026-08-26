import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// supabase's api settings page lists a "restful endpoint" (…/rest/v1) right
// next to the project url and they are easy to mix up. the client appends its
// own paths, so anything after the host has to come off or every request comes
// back "invalid path specified in request url". keeping only the origin also
// takes care of a stray trailing slash
function toProjectOrigin(rawUrl: string | undefined) {
  if (!rawUrl) return undefined
  try {
    return new URL(rawUrl).origin
  } catch {
    // not a parseable url, hand it over untouched and let supabase complain
    return rawUrl
  }
}

const supabaseUrl = toProjectOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL)
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
        // supabase-js will happily spot the ?code= in the url and exchange it
        // by itself. with our callback page doing the same thing, both fire and
        // the loser reports "pkce code verifier not found in storage" -- the
        // winner already consumed and deleted the verifier. one owner only, and
        // we keep the explicit one so failures surface in our own ui
        detectSessionInUrl: false,
      },
    })
  }

  return client
}
