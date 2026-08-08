'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { useSession } from '@/components/SessionProvider'
import {
  clearProfile,
  getProfile,
  getServerProfile,
  saveProfile,
  subscribe,
} from '@/lib/profile/storage'
import type { Profile } from '@/lib/profile/types'
import { getSupabase } from '@/lib/supabase/client'
import { fetchCloudProfile, saveCloudProfile } from '@/lib/supabase/profiles'

interface ProfileContextValue {
  profile: Profile | null
  save: (profile: Profile) => void
  reset: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

// the cloud copy is tagged with whose it is. without the tag, signing out and
// back in as someone else would briefly show the previous person's profile
interface CloudCopy {
  userId: string
  profile: Profile
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore is the right hook for anything living outside react
  const localProfile = useSyncExternalStore(subscribe, getProfile, getServerProfile)
  const { user } = useSession()
  const [cloudCopy, setCloudCopy] = useState<CloudCopy | null>(null)

  // pull down the cloud profile when someone signs in. if they have nothing up
  // there yet, push whatever is local so a profile filled out while signed out
  // survives the sign in
  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase || !user) return

    let abandoned = false
    const userId = user.id

    async function syncWithCloud() {
      const alreadyInCloud = await fetchCloudProfile(supabase!, userId)
      if (abandoned) return

      if (alreadyInCloud) {
        setCloudCopy({ userId, profile: alreadyInCloud })
        // mirror locally so the next page load has something instantly
        saveProfile(alreadyInCloud)
        return
      }

      const localToUpload = getProfile()
      if (!localToUpload) return

      await saveCloudProfile(supabase!, userId, localToUpload)
      if (abandoned) return
      setCloudCopy({ userId, profile: localToUpload })
    }

    syncWithCloud()

    // if the user changes mid flight, whatever comes back is stale
    return () => {
      abandoned = true
    }
  }, [user])

  // only trust the cloud copy if it belongs to whoever is signed in right now
  const cloudProfile = user && cloudCopy?.userId === user.id ? cloudCopy.profile : null

  // local stands in until the cloud answers, so nothing ever renders empty
  const profile = cloudProfile ?? localProfile

  const save = useCallback(
    (next: Profile) => {
      const stamped = { ...next, updatedAt: new Date().toISOString() }
      saveProfile(stamped)

      if (!user) return

      const supabase = getSupabase()
      if (!supabase) return

      setCloudCopy({ userId: user.id, profile: stamped })
      saveCloudProfile(supabase, user.id, stamped)
    },
    [user],
  )

  const reset = useCallback(() => {
    clearProfile()
    setCloudCopy(null)

    const supabase = getSupabase()
    if (!supabase || !user) return
    supabase.from('profiles').delete().eq('user_id', user.id)
  }, [user])

  const value = useMemo(() => ({ profile, save, reset }), [profile, save, reset])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile must be used inside <ProfileProvider>')
  return context
}
