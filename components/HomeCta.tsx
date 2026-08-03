'use client'

import Button from './Button'
import { useProfile } from './ProfileProvider'

// the cta depends on whether a profile exists, which is only knowable in the
// browser, so this bit can't be server rendered with the rest of the page
export default function HomeCta() {
  const { profile } = useProfile()

  if (profile) {
    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button href="/globe">See my globe</Button>
        <Button href="/profile" variant="ghost">
          Edit my profile
        </Button>
      </div>
    )
  }

  return <Button href="/profile">Build your profile</Button>
}
