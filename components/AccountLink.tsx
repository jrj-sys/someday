'use client'

import Button from './Button'
import { useSession } from './SessionProvider'

// small header control. hides itself entirely when there's no supabase project
// wired up, so the app doesn't advertise accounts it can't deliver
export default function AccountLink() {
  const { user, ready, configured } = useSession()

  if (!configured || !ready) return null

  if (user) {
    return (
      <Button href="/signin" variant="ghost" size="sm">
        Account
      </Button>
    )
  }

  return (
    <Button href="/signin" variant="ghost" size="sm">
      Sign in to save
    </Button>
  )
}
