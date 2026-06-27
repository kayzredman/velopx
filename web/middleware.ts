import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hasValidClerkKeys } from '@/lib/clerkConfig'
import { getRoleHomePath } from '@/lib/utils'

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
  if (request.nextUrl.pathname === '/') {
    const { userId, sessionClaims } = await auth()
    if (userId) {
      const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined
      const role = metadata?.role as string | undefined
      const roles = Array.isArray(metadata?.roles)
        ? (metadata.roles as unknown[]).filter((r): r is string => typeof r === 'string')
        : undefined
      return NextResponse.redirect(new URL(getRoleHomePath(role, roles), request.url))
    }
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  // Cross-portal access guard — prevent e.g. an assessor from browsing /dealer
  if (userId) {
    const meta = sessionClaims?.publicMetadata as { role?: string } | undefined
    const role = meta?.role
    if (role) {
      for (const [prefix, allowed] of Object.entries(PORTAL_ROLES)) {
        if (pathname.startsWith(prefix) && !allowed.includes(role)) {
          const url = request.nextUrl.clone()
          url.pathname = ROLE_HOME[role] ?? '/select-portal'
          return NextResponse.redirect(url)
        }
      }
    }
  }
})

export default hasValidClerkKeys() ? clerkHandler : devMiddleware

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
