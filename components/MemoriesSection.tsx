'use client'

import { useCallback, useEffect, useState } from 'react'
import Button from '@/components/Button'
import PlacePicker from '@/components/PlacePicker'
import { useSession } from '@/components/SessionProvider'
import {
  createEntry,
  deleteEntry,
  fetchEntriesForCountry,
  signPhotoUrls,
  uploadPhoto,
} from '@/lib/journal/entries'
import type { EntryPlace, JournalEntry } from '@/lib/journal/types'
import { shortPlaceName } from '@/lib/places/search'
import { getSupabase } from '@/lib/supabase/client'
import styles from './MemoriesSection.module.css'

interface MemoriesSectionProps {
  countryId: string
  countryCode?: string
  // called after an entry saves, so the globe can mark the country visited
  onEntrySaved: () => void
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

interface LoadedMemories {
  entries: JournalEntry[]
  photoUrls: Map<string, string>
}

// plain data fetch with no react in it, so the effect below can put the results
// into state from inside a promise callback rather than synchronously
async function loadMemories(userId: string, countryId: string): Promise<LoadedMemories> {
  const supabase = getSupabase()
  if (!supabase) return { entries: [], photoUrls: new Map() }

  const entries = await fetchEntriesForCountry(supabase, userId, countryId)

  // photos are private, so each load asks storage for fresh signed links
  const allPhotos = entries.flatMap((entry) => entry.photos)
  const photoUrls = await signPhotoUrls(supabase, allPhotos)

  return { entries, photoUrls }
}

export default function MemoriesSection({
  countryId,
  countryCode,
  onEntrySaved,
}: MemoriesSectionProps) {
  const { user } = useSession()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map())
  // which country the entries in state actually belong to. deriving "loading"
  // from this beats a loading flag that has to be set from inside an effect
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [saving, setSaving] = useState(false)

  const loading = user !== null && loadedFor !== countryId

  const [body, setBody] = useState('')
  const [place, setPlace] = useState<EntryPlace | null>(null)
  const [happenedOn, setHappenedOn] = useState(today)
  const [files, setFiles] = useState<File[]>([])

  const applyLoaded = useCallback(
    (loaded: LoadedMemories) => {
      setEntries(loaded.entries)
      setPhotoUrls(loaded.photoUrls)
      setLoadedFor(countryId)
    },
    [countryId],
  )

  useEffect(() => {
    if (!user) return
    let abandoned = false

    loadMemories(user.id, countryId).then((loaded) => {
      // the panel can switch countries mid flight, in which case this result
      // belongs to a country nobody is looking at any more
      if (!abandoned) applyLoaded(loaded)
    })

    return () => {
      abandoned = true
    }
  }, [user, countryId, applyLoaded])

  // used by the save and delete handlers, where an await is perfectly fine
  async function refresh() {
    if (!user) return
    applyLoaded(await loadMemories(user.id, countryId))
  }

  function resetComposer() {
    setBody('')
    setPlace(null)
    setHappenedOn(today())
    setFiles([])
    setComposing(false)
  }

  async function handleSave() {
    const supabase = getSupabase()
    if (!supabase || !user) return

    setSaving(true)
    const saved = await createEntry(supabase, user.id, { countryId, place, happenedOn, body })

    if (saved) {
      for (const file of files) {
        await uploadPhoto(supabase, user.id, saved.id, file)
      }
      onEntrySaved()
      await refresh()
      resetComposer()
    }
    setSaving(false)
  }

  async function handleDelete(entryId: string) {
    const supabase = getSupabase()
    if (!supabase) return
    await deleteEntry(supabase, entryId)
    await refresh()
  }

  if (!user) {
    return (
      <section className={styles.section}>
        <h3 className={styles.heading}>Memories</h3>
        <p className={styles.signedOut}>
          Journals live in your account. Sign in and you can write about this place.
        </p>
        <Button href="/signin" size="sm" variant="ghost">
          Sign in
        </Button>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.headingRow}>
        <h3 className={styles.heading}>Memories</h3>
        {!composing && (
          <Button size="sm" variant="ghost" onClick={() => setComposing(true)}>
            Add
          </Button>
        )}
      </div>

      {composing && (
        <div className={styles.composer}>
          <PlacePicker countryCode={countryCode} value={place} onChange={setPlace} />

          <input
            className={styles.date}
            type="date"
            value={happenedOn}
            onChange={(event) => setHappenedOn(event.target.value)}
          />

          <textarea
            className={styles.body}
            rows={4}
            placeholder="What happened?"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />

          <label className={styles.fileLabel}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
            {files.length > 0 && <span>{files.length} photo(s) ready</span>}
          </label>

          <div className={styles.composerActions}>
            <Button size="sm" onClick={handleSave} disabled={saving || body.trim() === ''}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetComposer}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading && <p className={styles.muted}>loading memories...</p>}

      {!loading && entries.length === 0 && !composing && (
        <p className={styles.muted}>Nothing written down yet.</p>
      )}

      <ul className={styles.entries}>
        {!loading &&
          entries.map((entry) => (
            <li key={entry.id} className={styles.entry}>
              <div className={styles.entryHead}>
                <span className={styles.date}>{entry.happenedOn}</span>
                <button
                  type="button"
                  className={styles.delete}
                  onClick={() => handleDelete(entry.id)}
                  aria-label="Delete entry"
                >
                  ×
                </button>
              </div>

              {entry.place && <p className={styles.place}>{shortPlaceName(entry.place.name)}</p>}
              {entry.body && <p className={styles.entryBody}>{entry.body}</p>}

              {entry.photos.length > 0 && (
                <div className={styles.photos}>
                  {entry.photos.map((photo) => {
                    const url = photoUrls.get(photo.storagePath)
                    if (!url) return null
                    // eslint-disable-next-line @next/next/no-img-element
                    return <img key={photo.id} src={url} alt="" className={styles.photo} />
                  })}
                </div>
              )}
            </li>
          ))}
      </ul>
    </section>
  )
}
