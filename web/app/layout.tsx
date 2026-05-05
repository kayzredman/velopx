import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'velopX — Auto Parts Intelligence',
  description: 'The intelligence layer that moves the auto parts industry',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#070C14] text-[#E8ECF1] antialiased" suppressHydrationWarning>
        <ClerkProvider
          dynamic
          signInFallbackRedirectUrl="/select-portal"
          signUpFallbackRedirectUrl="/select-portal"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
