import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dealer')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          velop<span className="text-[#F5A623]">X</span>
        </h1>
        <p className="mt-3 text-[#8A97AA] text-lg">
          The intelligence layer that moves the auto parts industry
        </p>
      </div>

      <div className="flex gap-4">
        <a
          href="/sign-in"
          className="px-6 py-3 rounded-lg bg-[#F5A623] text-black font-semibold hover:bg-[#d4911f] transition-colors"
        >
          Sign In
        </a>
        <a
          href="/sign-up"
          className="px-6 py-3 rounded-lg border border-[#1E2E48] text-[#E8ECF1] hover:border-[#F5A623] transition-colors"
        >
          Get Started
        </a>
      </div>
    </main>
  )
}
