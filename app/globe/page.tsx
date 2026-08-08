import AccountLink from '@/components/AccountLink'
import Button from '@/components/Button'
import GlobeShell from './globe-shell'
import styles from './globe.module.css'

export default function GlobePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Globe</h1>
        <div className={styles.headerActions}>
          <AccountLink />
          <Button variant="ghost" size="sm" href="/">
            Back home
          </Button>
        </div>
      </header>
      <GlobeShell />
    </div>
  )
}
