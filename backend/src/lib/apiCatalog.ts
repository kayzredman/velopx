export interface ApiEndpoint {
  method: string
  path: string
  auth: 'none' | 'clerk' | 'clerk+role' | 'webhook'
  roles?: string
  description: string
}

export interface WebRoute {
  path: string
  roles: string
  description: string
  status?: 'live' | 'stub'
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  { method: 'GET', path: '/health', auth: 'none', description: 'Liveness + dependency checks' },
  { method: 'GET', path: '/docs', auth: 'none', description: 'HTML API reference (this page, JSON at /docs.json)' },
  { method: 'POST', path: '/v1/webhooks/clerk', auth: 'webhook', description: 'Clerk user sync (Svix signed)' },
  { method: 'GET', path: '/v1/parts', auth: 'none', description: 'Public parts search' },
  { method: 'GET', path: '/v1/parts/benchmark', auth: 'none', description: 'Assessor price benchmark by OEM' },
  { method: 'GET', path: '/v1/parts/:id', auth: 'none', description: 'Part detail' },
  { method: 'GET', path: '/v1/parts/mine', auth: 'clerk', roles: 'dealer', description: 'Dealer-scoped catalogue' },
  { method: 'GET', path: '/v1/parts/mine/:id', auth: 'clerk', roles: 'dealer', description: 'Single owned listing' },
  { method: 'GET', path: '/v1/parts/marketplace', auth: 'clerk+role', roles: 'assessor, insurer_*, platform_admin', description: 'All dealers\' parts — assessor/insurer marketplace view' },
  { method: 'GET', path: '/v1/directory/garages', auth: 'clerk+role', roles: 'assessor, insurer_*, platform_admin', description: 'All registered garages' },
  { method: 'GET', path: '/v1/directory/dealers', auth: 'clerk+role', roles: 'assessor, insurer_*, platform_admin', description: 'All registered parts dealers' },
  { method: 'POST', path: '/v1/parts', auth: 'clerk+role', roles: 'dealer_owner, dealer_staff', description: 'Create part listing' },
  { method: 'PATCH', path: '/v1/parts/:id', auth: 'clerk+role', roles: 'dealer_owner, dealer_staff', description: 'Update part listing' },
  { method: 'DELETE', path: '/v1/parts/:id', auth: 'clerk+role', roles: 'dealer_owner, platform_admin', description: 'Delete part listing' },
  { method: 'GET', path: '/v1/quotes', auth: 'clerk', roles: 'garage', description: 'RFQs created by requester' },
  { method: 'GET', path: '/v1/quotes/for-dealer', auth: 'clerk', roles: 'dealer', description: 'RFQs containing dealer parts' },
  { method: 'GET', path: '/v1/quotes/:id', auth: 'clerk', description: 'Quote detail' },
  { method: 'POST', path: '/v1/quotes', auth: 'clerk', roles: 'garage', description: 'Create quote / RFQ' },
  { method: 'PATCH', path: '/v1/quotes/:id/status', auth: 'clerk', description: 'Respond, accept, or decline quote' },
  { method: 'GET', path: '/v1/orders', auth: 'clerk', roles: 'garage', description: 'Buyer orders' },
  { method: 'GET', path: '/v1/orders/for-dealer', auth: 'clerk', roles: 'dealer', description: 'Orders with seller parts' },
  { method: 'GET', path: '/v1/orders/:id', auth: 'clerk', description: 'Order detail' },
  { method: 'POST', path: '/v1/orders', auth: 'clerk', roles: 'garage', description: 'Create order from quote' },
  { method: 'PATCH', path: '/v1/orders/:id/status', auth: 'clerk', description: 'Update order status' },
  { method: 'GET', path: '/v1/deliveries', auth: 'clerk', description: 'Deliveries scoped by role' },
  { method: 'GET', path: '/v1/deliveries/:id', auth: 'clerk', description: 'Delivery detail' },
  { method: 'POST', path: '/v1/deliveries', auth: 'clerk+role', roles: 'dealer', description: 'Create delivery for confirmed order' },
  { method: 'PATCH', path: '/v1/deliveries/:id/status', auth: 'clerk', roles: 'driver, garage, dealer', description: 'Update delivery status / proof' },
  { method: 'GET', path: '/v1/audit/export', auth: 'clerk+role', roles: 'assessor, insurer_*', description: 'Per-claim audit export (JSON)' },
]

export const WEB_ROUTES: WebRoute[] = [
  { path: '/', roles: 'public', description: 'Marketing landing', status: 'live' },
  { path: '/catalogue', roles: 'public', description: 'Browse parts catalogue', status: 'live' },
  { path: '/sign-in', roles: 'public', description: 'Clerk sign-in', status: 'live' },
  { path: '/dealer', roles: 'dealer_owner, dealer_staff', description: 'Dealer dashboard', status: 'live' },
  { path: '/dealer/parts', roles: 'dealer_owner, dealer_staff', description: 'Manage catalogue', status: 'live' },
  { path: '/dealer/orders', roles: 'dealer_owner, dealer_staff', description: 'Seller orders', status: 'live' },
  { path: '/dealer/rfqs', roles: 'dealer_owner, dealer_staff', description: 'Incoming RFQs', status: 'live' },
  { path: '/dealer/dispatch', roles: 'dealer_owner, dealer_staff', description: 'Dispatch & deliveries', status: 'live' },
  { path: '/garage', roles: 'garage_owner, garage_staff', description: 'Garage dashboard', status: 'live' },
  { path: '/assess', roles: 'assessor, insurer_*', description: 'Benchmark & audit export tools', status: 'live' },
  { path: '/assess/catalogue', roles: 'assessor, insurer_*', description: 'Marketplace — all dealer parts', status: 'live' },
  { path: '/assess/garages', roles: 'assessor, insurer_*', description: 'Garage directory', status: 'live' },
  { path: '/assess/dealers', roles: 'assessor, insurer_*', description: 'Dealer directory', status: 'live' },
  { path: '/insight', roles: 'insurer_admin, insurer_staff', description: 'Insurer intelligence dashboard', status: 'live' },
  { path: '/insight/catalogue', roles: 'insurer_admin, insurer_staff', description: 'Marketplace — insurer view', status: 'live' },
  { path: '/insight/garages', roles: 'insurer_admin, insurer_staff', description: 'Garage directory — insurer view', status: 'live' },
  { path: '/insight/dealers', roles: 'insurer_admin, insurer_staff', description: 'Dealer directory — insurer view', status: 'live' },
  { path: '/docs', roles: 'public', description: 'Platform health & API reference', status: 'live' },
]
