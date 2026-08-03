import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { ProfileProvider } from '@/components/ProfileProvider'
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
        {/* profile lives in context + localStorage, so every route can read it
            without prop drilling. swaps to supabase in phase 4 */}
        <ProfileProvider>{children}</ProfileProvider>
      </body>
    </html>
  )
}
