import { Suspense } from 'react'
import CallbackHandler from './callback-handler'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  )
}
