import type { Profile } from './types'

// bumped if the profile shape ever changes in a way old saves can't satisfy
const KEY = 'someday.profile.v1'

// useSyncExternalStore compares snapshots with Object.is, so parsing fresh json
// on every read would hand react a new object each time and spin forever.
// cache the parsed value until the raw string actually changes
let cachedRaw: string | null = null
let cached: Profile | null = null

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribe(listener: () => void) {
  // the storage event only fires for *other* tabs, same-tab writes emit below
  if (listeners.size === 0) window.addEventListener('storage', emit)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', emit)
  }
}

export function getProfile(): Profile | null {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(KEY)
  } catch {
    // storage blocked in private windows and by some extensions. not worth
    // crashing over, just behave like there's no profile
    return null
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw
    try {
      cached = raw ? (JSON.parse(raw) as Profile) : null
    } catch {
      cached = null
    }
  }
  return cached
}

// there's no localStorage during ssr, so the server always renders the "no
// profile yet" version and the real one arrives right after hydration
export function getServerProfile(): Profile | null {
  return null
}

export function saveProfile(profile: Profile) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    // quota or blocked storage. phase 4 moves this to supabase anyway
  }
  emit()
}

export function clearProfile() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {}
  emit()
}
