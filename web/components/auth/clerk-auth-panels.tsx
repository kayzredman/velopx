'use client'

import { SignIn, SignUp } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { getClerkTheme } from '@/lib/clerkTheme'
import { hasValidClerkKeys } from '@/lib/clerkConfig'

export function SignInPanel() {
  const { resolvedTheme } = useTheme()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">
          velop<span className="text-primary">X</span>
        </h1>
      </div>
      {hasValidClerkKeys() ? (
        <SignIn appearance={getClerkTheme(resolvedTheme)} />
      ) : (
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Clerk keys are not configured. Add real keys to <code className="text-primary">.env</code> to enable sign-in.
        </p>
      )}
    </main>
  )
}

export function SignUpPanel() {
  const { resolvedTheme } = useTheme()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">
          velop<span className="text-primary">X</span>
        </h1>
      </div>
      {hasValidClerkKeys() ? (
        <SignUp appearance={getClerkTheme(resolvedTheme)} />
      ) : (
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Clerk keys are not configured. Add real keys to <code className="text-primary">.env</code> to enable sign-up.
        </p>
      )}
    </main>
  )
}
