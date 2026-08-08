'use client'

import type { User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'

interface SessionContextValue {
  user: User | null
  // false until we've asked supabase whether there's an existing session, so
  // the ui doesn't flash "signed out" at someone who is signed in
  ready: boolean
  configured: boolean
  sendMagicLink: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!isSupabaseConfigured)

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return

    // getSession resolves from whatever is already in storage, then the
    // listener keeps us honest for sign in, sign out and token refreshes
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setReady(true)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const value = useMemo<SessionContextValue>(() => {
    async function sendMagicLink(email: string) {
      const supabase = getSupabase()
      if (!supabase) return { error: 'Supabase is not configured yet.' }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })

      if (error) return { error: error.message }
      return { error: null }
    }

    async function signOut() {
      const supabase = getSupabase()
      if (!supabase) return
      await supabase.auth.signOut()
    }

    return { user, ready, configured: isSupabaseConfigured, sendMagicLink, signOut }
  }, [user, ready])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used inside <SessionProvider>')
  return context
}
