import type { SupabaseClient } from '@supabase/supabase-js'
import type { DraftEntry, JournalEntry, JournalPhoto } from './types'

// signed links are deliberately short lived. the photo is private, the link is
// a temporary loan, and the app just asks for a fresh one each time it renders
const SIGNED_URL_SECONDS = 60 * 60

interface EntryRow {
  id: string
  country_id: string
  place_name: string | null
  place_lat: number | null
  place_lon: number | null
  happened_on: string
  body: string
  created_at: string
  journal_photos: { id: string; storage_path: string }[] | null
}

function rowToEntry(row: EntryRow): JournalEntry {
  const hasPlace = row.place_name !== null && row.place_lat !== null && row.place_lon !== null

  const photos: JournalPhoto[] = (row.journal_photos ?? []).map((photo) => ({
    id: photo.id,
    storagePath: photo.storage_path,
  }))

  return {
    id: row.id,
    countryId: row.country_id,
    place: hasPlace ? { name: row.place_name!, lat: row.place_lat!, lon: row.place_lon! } : null,
    happenedOn: row.happened_on,
    body: row.body,
    createdAt: row.created_at,
    photos,
  }
}

export async function fetchEntriesForCountry(
  supabase: SupabaseClient,
  userId: string,
  countryId: string,
): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*, journal_photos(id, storage_path)')
    .eq('user_id', userId)
    .eq('country_id', countryId)
    .order('happened_on', { ascending: false })

  if (error) {
    console.error('could not load journal entries', error)
    return []
  }

  return (data as EntryRow[]).map(rowToEntry)
}

export async function createEntry(
  supabase: SupabaseClient,
  userId: string,
  draft: DraftEntry,
): Promise<JournalEntry | null> {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: userId,
      country_id: draft.countryId,
      place_name: draft.place?.name ?? null,
      place_lat: draft.place?.lat ?? null,
      place_lon: draft.place?.lon ?? null,
      happened_on: draft.happenedOn,
      body: draft.body,
    })
    .select('*, journal_photos(id, storage_path)')
    .single()

  if (error) {
    console.error('could not save journal entry', error)
    return null
  }

  return rowToEntry(data as EntryRow)
}

export async function deleteEntry(supabase: SupabaseClient, entryId: string): Promise<void> {
  const { error } = await supabase.from('journal_entries').delete().eq('id', entryId)
  if (error) console.error('could not delete journal entry', error)
}

// the path shape matters: storage's policies read the first folder segment to
// decide who owns the file, so the user id has to come first
function storagePathFor(userId: string, entryId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${entryId}/${Date.now()}-${safeName}`
}

export async function uploadPhoto(
  supabase: SupabaseClient,
  userId: string,
  entryId: string,
  file: File,
): Promise<JournalPhoto | null> {
  const path = storagePathFor(userId, entryId, file.name)

  const upload = await supabase.storage.from('memories').upload(path, file)
  if (upload.error) {
    console.error('could not upload photo', upload.error)
    return null
  }

  const { data, error } = await supabase
    .from('journal_photos')
    .insert({ entry_id: entryId, user_id: userId, storage_path: path })
    .select('id, storage_path')
    .single()

  if (error) {
    console.error('photo uploaded but could not be recorded', error)
    return null
  }

  return { id: data.id, storagePath: data.storage_path }
}

// storage hands back a signed link only if the policies say this person may
// read the file, which is what keeps a stray url from working
export async function signPhotoUrls(
  supabase: SupabaseClient,
  photos: JournalPhoto[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>()
  if (photos.length === 0) return urls

  const paths = photos.map((photo) => photo.storagePath)
  const { data, error } = await supabase.storage
    .from('memories')
    .createSignedUrls(paths, SIGNED_URL_SECONDS)

  if (error || !data) {
    console.error('could not sign photo urls', error)
    return urls
  }

  for (const signed of data) {
    if (signed.signedUrl && signed.path) urls.set(signed.path, signed.signedUrl)
  }
  return urls
}
