'use client'

import Image from 'next/image'
import { useState } from 'react'
import Button from '@/components/Button'
import { useSession } from '@/components/SessionProvider'
import styles from './signin.module.css'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function SignInForm() {
  const { user, configured, sendMagicLink, signOut } = useSession()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorText, setErrorText] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus('sending')

    const { error } = await sendMagicLink(email.trim())

    if (error) {
      setErrorText(error)
      setStatus('error')
      return
    }
    setStatus('sent')
  }

  if (!configured) {
    return (
      <div className={styles.card}>
        <h1 className={styles.heading}>Not set up yet</h1>
        <p className={styles.copy}>
          Someday has no Supabase project connected, so accounts are switched off. Everything still
          works, it just lives in this browser.
        </p>
        <p className={styles.copy}>
          See <code>.env.local.example</code> for what to fill in.
        </p>
        <Button href="/">Back home</Button>
      </div>
    )
  }

  if (user) {
    return (
      <div className={styles.card}>
        <Image src="/logo.svg" alt="" width={56} height={56} />
        <h1 className={styles.heading}>You are signed in</h1>
        <p className={styles.copy}>{user.email}</p>
        <div className={styles.actions}>
          <Button href="/globe">See my globe</Button>
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'sent') {
    return (
      <div className={styles.card}>
        <Image src="/logo.svg" alt="" width={56} height={56} />
        <h1 className={styles.heading}>Check your email</h1>
        <p className={styles.copy}>
          We sent a sign-in link to <strong>{email}</strong>. Open it on this device and you will
          land back here signed in.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <Image src="/logo.svg" alt="" width={56} height={56} />
      <h1 className={styles.heading}>Save your someday</h1>
      <p className={styles.copy}>
        Sign in and your profile follows you between browsers. No password, we email you a link.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          className={styles.input}
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending...' : 'Email me a link'}
        </Button>
      </form>

      {status === 'error' && <p className={styles.error}>{errorText}</p>}
    </div>
  )
}
