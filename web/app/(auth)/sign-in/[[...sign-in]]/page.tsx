import { SignIn } from '@clerk/nextjs'
import { velopXTheme } from '@/lib/clerkTheme'

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#070C14] flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          velop<span className="text-[#F5A623]">X</span>
        </h1>
      </div>
      <SignIn appearance={velopXTheme} />
    </main>
  )
}
