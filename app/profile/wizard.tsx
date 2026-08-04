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

  function patch(fields: Partial<Profile>) {
    setDraft((previous) => ({ ...previous, ...fields }))
  }

  function toggleActivity(id: ActivityId) {
    const alreadyPicked = draft.activities.includes(id)

    if (alreadyPicked) {
      const withoutThisOne = draft.activities.filter((activity) => activity !== id)
      patch({ activities: withoutThisOne })
    } else {
      patch({ activities: [...draft.activities, id] })
    }
  }

  const isLastStep = step === STEPS.length - 1

  // only gate the first step, the rest all have sensible defaults or are
  // legitimately allowed to be empty
  const isActivityStep = step === 0
  const canAdvance = isActivityStep ? draft.activities.length > 0 : true

  function goToNextStep() {
    if (isLastStep) {
      save(draft)
      router.push('/globe')
      return
    }
    setStep((currentStep) => currentStep + 1)
  }

  function goToPreviousStep() {
    setStep((currentStep) => currentStep - 1)
  }

  return (
    <div className={styles.wizard}>
      <div className={styles.progress}>
        {STEPS.map((label, stepIndex) => {
          const reachedThisStep = stepIndex <= step
          return <span key={label} className={reachedThisStep ? styles.dotDone : styles.dot} />
        })}
      </div>

      <h1 className={styles.question}>{STEPS[step]}</h1>

      <div className={styles.body}>
        {step === 0 && (
          <>
            <p className={styles.hint}>Pick as many as you like. This drives everything.</p>
            <div className={styles.chipGrid}>
              {ACTIVITIES.map((activity) => {
                const isPicked = draft.activities.includes(activity.id)
                return (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => toggleActivity(activity.id)}
                    className={isPicked ? styles.chipOn : styles.chipOff}
                  >
                    <span aria-hidden>{activity.emoji}</span> {activity.label}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 1 && (
          <div className={styles.cardGrid}>
            {CLIMATES.map((climate) => {
              const isPicked = draft.climate === climate.id
              return (
                <button
                  key={climate.id}
                  type="button"
                  onClick={() => patch({ climate: climate.id })}
                  className={isPicked ? styles.cardOn : styles.cardOff}
                >
                  <strong>{climate.label}</strong>
                  <span>{climate.hint}</span>
                </button>
              )
            })}
          </div>
        )}

        {step === 2 && (
          <div className={styles.cardGrid}>
            {BUDGETS.map((budget) => {
              const isPicked = draft.budget === budget.id
              return (
                <button
                  key={budget.id}
                  type="button"
                  onClick={() => patch({ budget: budget.id })}
                  className={isPicked ? styles.cardOn : styles.cardOff}
                >
                  <strong>{budget.label}</strong>
                  <span>{budget.hint}</span>
                </button>
              )
            })}
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
          <Button variant="ghost" size="sm" onClick={goToPreviousStep}>
            Back
          </Button>
        )}
        <div className={styles.spacer} />
        <Button onClick={goToNextStep} disabled={!canAdvance}>
          {isLastStep ? 'See my globe' : 'Next'}
        </Button>
      </div>
    </div>
  )
}
