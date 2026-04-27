import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

/** Maps Clerk publicMetadata.role → home pathname */
const ROLE_HOME: Record<string, string> = {
  dealer_owner:   '/dealer',
  dealer_staff:   '/dealer',
  assessor:       '/assess',
  insurer_admin:  '/insight',
  insurer_staff:  '/insight',
  garage_owner:   '/garage',
  garage_staff:   '/garage',
  driver:         '/dealer',      // driver web portal TBD
  platform_admin: '/dealer',
}

/** Portal prefixes used for cross-portal access protection */
const PORTAL_ROLES: Record<string, string[]> = {
  '/dealer':  ['dealer_owner', 'dealer_staff', 'platform_admin', 'driver'],
  '/assess':  ['assessor', 'platform_admin'],
  '/insight': ['insurer_admin', 'insurer_staff', 'platform_admin'],
  '/garage':  ['garage_owner', 'garage_staff', 'platform_admin'],
}

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth()
  const { pathname } = request.nextUrl

  // Redirect authenticated users from landing page to their portal
  if (userId && pathname === '/') {
    const meta = sessionClaims?.publicMetadata as { role?: string } | undefined
    const home = (meta?.role && ROLE_HOME[meta.role]) ?? '/select-portal'
    const url = request.nextUrl.clone()
    url.pathname = home
    return NextResponse.redirect(url)
  }

  // Protect all non-public routes
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

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
