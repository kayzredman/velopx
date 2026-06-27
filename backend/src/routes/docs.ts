import { Router } from 'express'
import { API_ENDPOINTS, WEB_ROUTES } from '../lib/apiCatalog'
import { getHealthReport } from '../lib/healthStatus'

const router = Router()

function authBadge(auth: string): string {
  const colors: Record<string, string> = {
    none: '#22c55e',
    clerk: '#f5a623',
    'clerk+role': '#f97316',
    webhook: '#8b5cf6',
  }
  const c = colors[auth] ?? '#8a97aa'
  return `<span style="background:${c}22;color:${c};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">${auth}</span>`
}

function statusDot(ok: boolean): string {
  return `<span style="color:${ok ? '#22c55e' : '#ef4444'}">●</span>`
}

function renderHtml(health: Awaited<ReturnType<typeof getHealthReport>>): string {
  const webBase = process.env.WEB_PUBLIC_URL ?? 'http://localhost:3101'

  const apiRows = API_ENDPOINTS.map(
    (e) =>
      `<tr>
        <td><code style="color:#f5a623">${e.method}</code></td>
        <td><code>${e.path}</code></td>
        <td>${authBadge(e.auth)}</td>
        <td>${e.roles ?? '—'}</td>
        <td>${e.description}</td>
      </tr>`
  ).join('')

  const webRows = WEB_ROUTES.map((r) => {
    const href = r.path === '/docs' ? `${webBase}/docs` : `${webBase}${r.path}`
    const tag =
      r.status === 'stub'
        ? '<span style="color:#8a97aa;font-size:11px"> (Phase 2 stub)</span>'
        : ''
    return `<tr>
      <td><a href="${href}" style="color:#f5a623">${r.path}</a>${tag}</td>
      <td>${r.roles}</td>
      <td>${r.description}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="30" />
  <title>velopX — API Docs &amp; Health</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Inter, system-ui, sans-serif; background: #070c14; color: #e8ecf1; margin: 0; line-height: 1.5; }
    a { color: #f5a623; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 32px 20px 64px; }
    h1 { font-size: 28px; margin: 0 0 4px; }
    h1 span { color: #f5a623; }
    .sub { color: #8a97aa; margin-bottom: 28px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 32px; }
    .card { background: #0c1526; border: 1px solid #1e2e48; border-radius: 10px; padding: 16px; }
    .card label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #8a97aa; margin-bottom: 4px; }
    .card .val { font-size: 20px; font-weight: 700; }
    .card .val.ok { color: #22c55e; }
    .card .val.warn { color: #f5a623; }
    .card .val.err { color: #ef4444; }
    section { margin-bottom: 36px; }
    h2 { font-size: 18px; border-bottom: 1px solid #1e2e48; padding-bottom: 8px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; color: #8a97aa; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; padding: 8px 10px; border-bottom: 1px solid #1e2e48; }
    td { padding: 10px; border-bottom: 1px solid #111e34; vertical-align: top; }
    code { font-family: ui-monospace, monospace; font-size: 13px; }
    .note { background: #111e34; border-left: 3px solid #f5a623; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 14px; color: #8a97aa; margin-bottom: 24px; }
    footer { color: #8a97aa; font-size: 12px; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>velop<span>X</span> Platform Docs</h1>
    <p class="sub">Live health · REST API · Web routes · Auto-refreshes every 30s</p>

    <div class="note">
      <strong style="color:#e8ecf1">Insurance companies</strong> → web app at
      <a href="${webBase}/insight"><code>${webBase}/insight</code></a>
      (Phase 2 stub). Assessor / claims tools today:
      <a href="${webBase}/assess"><code>${webBase}/assess</code></a>.
      Set Clerk public metadata <code>{ "role": "insurer_admin" }</code> for access.
    </div>

    <div class="grid">
      <div class="card"><label>Overall</label><div class="val ${health.status === 'ok' ? 'ok' : health.status === 'degraded' ? 'warn' : 'err'}">${health.status.toUpperCase()}</div></div>
      <div class="card"><label>API</label><div class="val ok">${statusDot(true)} ok</div></div>
      <div class="card"><label>PostgreSQL</label><div class="val ${health.checks.database === 'ok' ? 'ok' : 'err'}">${statusDot(health.checks.database === 'ok')} ${health.checks.database}</div></div>
      <div class="card"><label>Kafka</label><div class="val ${health.checks.kafka === 'error' ? 'err' : 'ok'}">${statusDot(health.checks.kafka !== 'error')} ${health.checks.kafka}</div></div>
      <div class="card"><label>Clerk</label><div class="val ${health.checks.clerk === 'configured' ? 'ok' : 'warn'}">${health.checks.clerk}</div></div>
      <div class="card"><label>Updated</label><div class="val" style="font-size:13px;font-weight:400">${health.ts}</div></div>
    </div>

    <section>
      <h2>Web app routes</h2>
      <p style="color:#8a97aa;font-size:14px;margin:-8px 0 16px">Hybrid UI at <a href="${webBase}/docs">${webBase}/docs</a></p>
      <table>
        <thead><tr><th>Path</th><th>Roles</th><th>Description</th></tr></thead>
        <tbody>${webRows}</tbody>
      </table>
    </section>

    <section>
      <h2>REST API (<code>/v1</code>)</h2>
      <p style="color:#8a97aa;font-size:14px;margin:-8px 0 16px">Machine-readable: <a href="/docs.json"><code>/docs.json</code></a> · Liveness: <a href="/health"><code>/health</code></a></p>
      <table>
        <thead><tr><th>Method</th><th>Path</th><th>Auth</th><th>Roles</th><th>Description</th></tr></thead>
        <tbody>${apiRows}</tbody>
      </table>
    </section>

    <footer>
      velopX v${health.version} · ${health.counts.apiEndpoints} API endpoints · ${health.counts.webRoutes} web routes
    </footer>
  </div>
</body>
</html>`
}

router.get('/docs.json', async (_req, res, next) => {
  try {
    const health = await getHealthReport()
    res.json({
      health,
      api: API_ENDPOINTS,
      web: WEB_ROUTES,
      links: {
        html: '/docs',
        health: '/health',
        webDocs: `${process.env.WEB_PUBLIC_URL ?? 'http://localhost:3101'}/docs`,
        insurerPortal: `${process.env.WEB_PUBLIC_URL ?? 'http://localhost:3101'}/insight`,
        assessorTools: `${process.env.WEB_PUBLIC_URL ?? 'http://localhost:3101'}/assess`,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/docs', async (_req, res, next) => {
  try {
    const health = await getHealthReport()
    res.type('html').send(renderHtml(health))
  } catch (err) {
    next(err)
  }
})

export default router
