import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hasValidClerkKeys } from '@/lib/clerkConfig'

const isPublicRoute = createRouteMatcher([
  '/',
  '/catalogue(.*)',
  '/docs',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

function devMiddleware(request: NextRequest) {
  if (!isPublicRoute(request)) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  return NextResponse.next()
}

// Clerk v6 + Next.js 15: await auth() and auth.protect() in middleware
const clerkHandler = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()

  // Signed-in home → workspace picker (roles resolved server-side on that page)
  if (userId && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/select-portal', request.url))
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export default hasValidClerkKeys() ? clerkHandler : devMiddleware

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
