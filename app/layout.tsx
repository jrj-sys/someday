import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { ProfileProvider } from '@/components/ProfileProvider'
import { SessionProvider } from '@/components/SessionProvider'
import './globals.css'

// geist mono went with the scaffold, nothing was using it
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'someday',
  description: 'An all encompassing travel lifecycle app.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body>
        {/* session has to sit outside the profile, since who is signed in
            decides whether the profile syncs to the cloud or stays local */}
        <SessionProvider>
          <ProfileProvider>{children}</ProfileProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
