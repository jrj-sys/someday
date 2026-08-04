'use client'

import type { ScoredCountry } from '@/lib/recommend/types'
import styles from './CountryPanel.module.css'

interface CountryPanelProps {
  name: string
  visited: boolean
  scored: ScoredCountry | null
  rank: number | null
  onClose: () => void
}

export default function CountryPanel({ name, visited, scored, rank, onClose }: CountryPanelProps) {
  const matchPercent = scored ? Math.round(scored.score * 100) : 0

  return (
    <aside className={styles.panel}>
      <button className={styles.close} onClick={onClose} aria-label="Close">
        ×
      </button>

      <h2 className={styles.name}>{name}</h2>

      {visited && <p className={styles.visited}>You have been here</p>}

      {!visited && scored && (
        <>
          <div className={styles.scoreRow}>
            <div className={styles.meter}>
              <span style={{ width: `${matchPercent}%` }} />
            </div>
            <span className={styles.scoreText}>{matchPercent}% match</span>
          </div>
          {rank !== null && <p className={styles.rank}>#{rank} recommendation for you</p>}

          <ul className={styles.reasons}>
            {scored.reasons.map((reason) => {
              const toneClass = reason.positive ? styles.good : styles.bad
              return (
                <li key={reason.kind} className={toneClass}>
                  {reason.text}
                </li>
              )
            })}
          </ul>
        </>
      )}

      {/* the dataset is ~70 destinations, everywhere else has nothing to say yet */}
      {!visited && !scored && <p className={styles.unknown}>Not scored yet, no data on file.</p>}
    </aside>
  )
}
