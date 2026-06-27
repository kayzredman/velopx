import { ClerkProvider } from '@clerk/nextjs'
import { hasValidClerkKeys } from '@/lib/clerkConfig'

export default function ClerkShellLayout({ children }: { children: React.ReactNode }) {
  if (!hasValidClerkKeys()) return children
  return <ClerkProvider>{children}</ClerkProvider>
}
