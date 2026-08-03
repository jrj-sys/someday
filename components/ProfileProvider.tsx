'use client'

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react'
import {
  clearProfile,
  getProfile,
  getServerProfile,
  saveProfile,
  subscribe,
} from '@/lib/profile/storage'
import type { Profile } from '@/lib/profile/types'

interface ProfileContextValue {
  profile: Profile | null
  save: (profile: Profile) => void
  reset: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore is the right hook for anything living outside react
  const profile = useSyncExternalStore(subscribe, getProfile, getServerProfile)

  const save = useCallback((next: Profile) => {
    saveProfile({ ...next, updatedAt: new Date().toISOString() })
  }, [])

  const reset = useCallback(() => clearProfile(), [])

  const value = useMemo(() => ({ profile, save, reset }), [profile, save, reset])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>')
  return ctx
}
