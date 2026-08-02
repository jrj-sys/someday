import Button from '@/components/Button'
import GlobeShell from './globe-shell'
import styles from './globe.module.css'

export default function GlobePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Globe</h1>
        <Button variant="ghost" size="sm" href="/">
          Back home
        </Button>
      </header>
      <GlobeShell />
    </div>
  )
}
