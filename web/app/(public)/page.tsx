import Link from 'next/link'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConditionBadge } from '@/components/brand/Badges'
import { PartCard } from '@/components/parts/PartCard'
import { publicFetch, type Part } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

async function getCataloguePreview() {
  try {
    return await publicFetch<{ data: Part[] }>('/v1/parts?limit=4')
  } catch {
    return { data: [] }
  }
}

export default async function HomePage() {
  const { data: parts } = await getCataloguePreview()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <BrandLogo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <Link href="#platform">Platform</Link>
            <Link href="#assessors">Assessors</Link>
            <Link href="/catalogue">Catalogue</Link>
          </nav>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Governance-Grade Parts Infrastructure
          </p>
          <h1 className="font-display text-5xl font-extrabold leading-tight tracking-tight">
            The Motor Claims
            <br />
            <span className="text-primary">Source of Truth.</span>
          </h1>
          <p className="mt-6 max-w-lg text-muted-foreground leading-relaxed">
            Replacing phone calls with auditable data. Connect dealers, garages, dispatchers, and insurers on a single
            transparent marketplace — from RFQ to delivered part.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/sign-up">Request Demo</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/assess">Assessor Tools</Link>
            </Button>
          </div>
        </div>

        <Card className="bg-navy-900">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <p className="font-semibold">Live Benchmark</p>
                <p className="text-xs text-muted-foreground">Claim Ref: #GH-9942 · RAV4 2022</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Market Avg</p>
                <p className="font-display text-xl font-bold">GHS 17,200</p>
              </div>
            </div>
            {['Apex Auto Spares', 'Northroad Parts Co.', 'Salvage Yard 22'].map((name, i) => (
              <div key={name} className="flex items-center justify-between border-b border-border px-5 py-4 last:border-0">
                <div>
                  <p className="font-medium">{name}</p>
                  <ConditionBadge condition={i === 0 ? 'oem' : i === 1 ? 'aftermarket' : 'used'} />
                </div>
                <p className="font-display font-bold text-primary">
                  {formatCurrency(i === 0 ? 16200 : i === 1 ? 10800 : 5100, 'GHS')}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="border-y border-border bg-navy-900">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-5">
          {[
            ['0', 'Phone calls needed'],
            ['100%', 'Auditable trails'],
            ['< 2h', 'Average quote time'],
            ['24/7', 'Pricing availability'],
            ['2', 'Launch markets'],
          ].map(([val, label]) => (
            <div key={label} className="text-center">
              <p className="font-display text-2xl font-extrabold">{val}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="assessors" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Card className="bg-navy-900">
            <CardContent className="space-y-3 p-6 font-mono text-sm">
              <p className="text-green-400">✓ Part Verified</p>
              <p>OEM No: 53711-42200</p>
              <p>Invoice: KES 18,500</p>
              <p>Benchmark Avg: KES 17,200</p>
              <p className="text-red-400">Variance: +7.6% — Review</p>
            </CardContent>
          </Card>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">For Insurance Assessors</p>
            <h2 className="mt-4 font-display text-3xl font-bold">Stop guessing. Start defending every claim line.</h2>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>Instant benchmark comparison (Low / Avg / High)</li>
              <li>Automated flagging of parts &gt;15% above market</li>
              <li>One-click audit reports for claim files</li>
            </ul>
            <Button className="mt-6" asChild>
              <Link href="/assess">Open Assessor Tools</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="platform" className="border-t border-border bg-navy-950 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">Comprehensive Coverage</h2>
              <p className="text-sm text-muted-foreground">All conditions, fully benchmarked.</p>
            </div>
            <Link href="/catalogue" className="text-sm font-semibold text-primary">
              Browse catalogue →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {parts.map((part) => (
              <PartCard key={part.id} part={part} href={`/catalogue/${part.id}`} showDealer={false} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
