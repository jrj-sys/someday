'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/Button'
import CountryPicker from '@/components/CountryPicker'
import { useProfile } from '@/components/ProfileProvider'
import { fetchWorld, type World } from '@/lib/data/world'
import {
  ACTIVITIES,
  BUDGETS,
  CLIMATES,
  emptyProfile,
  type ActivityId,
  type Profile,
} from '@/lib/profile/types'
import styles from './profile.module.css'

const STEPS = [
  'What do you love?',
  'Your kind of weather',
  'How you travel',
  'Where you have been',
  'Where you dream of',
] as const

export default function Wizard() {
  const router = useRouter()
  const { profile, save } = useProfile()
  const [draft, setDraft] = useState<Profile>(emptyProfile)
  const [seeded, setSeeded] = useState(false)
  const [step, setStep] = useState(0)
  const [world, setWorld] = useState<World | null>(null)

  // a saved profile only shows up after hydration, so seed the draft the first
  // time it appears. adjusting state during render like this is react's own
  // recommendation over an effect -- it re-renders before committing anything
  if (!seeded && profile) {
    setSeeded(true)
    setDraft(profile)
  }

  // both country steps share one copy of the geojson
  useEffect(() => {
    fetchWorld().then(setWorld).catch(console.error)
  }, [])

  const patch = (fields: Partial<Profile>) => setDraft((d) => ({ ...d, ...fields }))

  const toggleActivity = (id: ActivityId) => {
    patch({
      activities: draft.activities.includes(id)
        ? draft.activities.filter((a) => a !== id)
        : [...draft.activities, id],
    })
  }

  const isLast = step === STEPS.length - 1
  // only gate the first step, the rest all have sensible defaults or are
  // legitimately allowed to be empty
  const canAdvance = step === 0 ? draft.activities.length > 0 : true

  const next = () => {
    if (isLast) {
      save(draft)
      router.push('/globe')
      return
    }
    setStep((s) => s + 1)
  }

  return (
    <div className={styles.wizard}>
      <div className={styles.progress}>
        {STEPS.map((label, i) => (
          <span key={label} className={i <= step ? styles.dotDone : styles.dot} />
        ))}
      </div>

      <h1 className={styles.question}>{STEPS[step]}</h1>

      <div className={styles.body}>
        {step === 0 && (
          <>
            <p className={styles.hint}>Pick as many as you like. This drives everything.</p>
            <div className={styles.chipGrid}>
              {ACTIVITIES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleActivity(a.id)}
                  className={draft.activities.includes(a.id) ? styles.chipOn : styles.chipOff}
                >
                  <span aria-hidden>{a.emoji}</span> {a.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <div className={styles.cardGrid}>
            {CLIMATES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => patch({ climate: c.id })}
                className={draft.climate === c.id ? styles.cardOn : styles.cardOff}
              >
                <strong>{c.label}</strong>
                <span>{c.hint}</span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className={styles.cardGrid}>
            {BUDGETS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => patch({ budget: b.id })}
                className={draft.budget === b.id ? styles.cardOn : styles.cardOff}
              >
                <strong>{b.label}</strong>
                <span>{b.hint}</span>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <>
            <p className={styles.hint}>Spin the globe and tap the ones you have been to.</p>
            <CountryPicker
              world={world}
              value={draft.visited}
              onChange={(visited) => patch({ visited })}
            />
          </>
        )}

        {step === 4 && (
          <>
            <p className={styles.hint}>The ones that have been on your list forever.</p>
            <CountryPicker
              world={world}
              value={draft.dreams}
              onChange={(dreams) => patch({ dreams })}
            />
          </>
        )}
      </div>

      <div className={styles.actions}>
        {step > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        )}
        <div className={styles.spacer} />
        <Button onClick={next} disabled={!canAdvance}>
          {isLast ? 'See my globe' : 'Next'}
        </Button>
      </div>
    </div>
  )
}
