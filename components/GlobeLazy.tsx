'use client'

import dynamic from 'next/dynamic'

// react-globe.gl touches window at import time so it can never render on the
// server -- ssr:false stops next from even trying. shared from one place so
// both the globe page and the profile wizard get the same lazy chunk
const GlobeLazy = dynamic(() => import('./GlobeView'), {
  ssr: false,
  loading: () => (
    <p style={{ padding: 40, textAlign: 'center', opacity: 0.6 }}>loading the world...</p>
  ),
})

export default GlobeLazy
