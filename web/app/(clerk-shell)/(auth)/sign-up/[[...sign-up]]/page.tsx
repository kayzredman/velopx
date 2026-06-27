import { SignUp } from '@clerk/nextjs'
import { velopXTheme } from '@/lib/clerkTheme'
import { hasValidClerkKeys } from '@/lib/clerkConfig'

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#070C14] flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          velop<span className="text-[#F5A623]">X</span>
        </h1>
      </div>
      {hasValidClerkKeys() ? (
        <SignUp appearance={velopXTheme} />
      ) : (
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Clerk keys are not configured. Add real keys to <code className="text-primary">.env</code> to enable sign-up.
        </p>
      )}
    </main>
  )
}
