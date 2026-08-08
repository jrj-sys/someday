'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Button from '@/components/Button'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import styles from './callback.module.css'

// where the magic link lands. pkce puts a short lived code in the query string
// and we trade it for a real session before sending them on
export default function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const [exchangeError, setExchangeError] = useState('')

  // knowable before we do any work, so it stays derived rather than living in
  // state and being set from inside an effect
  function findSetupProblem() {
    if (!isSupabaseConfigured)
      return 'Supabase is not connected, so there is nothing to sign in to.'
    if (!code) return 'That link is missing its sign-in code.'
    return null
  }

  const setupProblem = findSetupProblem()

  useEffect(() => {
    if (setupProblem || !code) return

    const supabase = getSupabase()
    if (!supabase) return

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setExchangeError(error.message)
        return
      }
      router.replace('/globe')
    })
  }, [code, setupProblem, router])

  const problem = setupProblem ?? exchangeError

  if (problem) {
    return (
      <main className={styles.page}>
        <p className={styles.message}>{problem}</p>
        <Button href="/signin">Try again</Button>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <p className={styles.message}>Signing you in...</p>
    </main>
  )
}
