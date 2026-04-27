'use client'
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-array-index-key */

import { useEffect } from 'react'

// ── Data ──────────────────────────────────────────────────────────────────────

const VX_MARQUEE = [
  { src: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=640&q=70&auto=format&fit=crop', alt: 'Parts warehouse' },
  { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=70&auto=format&fit=crop', alt: 'Workshop bay' },
  { src: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=640&q=70&auto=format&fit=crop', alt: 'Parts shelf' },
  { src: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=640&q=70&auto=format&fit=crop', alt: 'Headlight assembly' },
  { src: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=640&q=70&auto=format&fit=crop', alt: 'Side mirror' },
  { src: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=640&q=70&auto=format&fit=crop', alt: 'Front bumper' },
  { src: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=640&q=70&auto=format&fit=crop', alt: 'Engine bay' },
  { src: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=640&q=70&auto=format&fit=crop', alt: 'Mechanic at work' },
]

const VX_STATS = [
  { val: '0',        lbl: 'Phone calls needed' },
  { val: '100%',     lbl: 'Auditable trails' },
  { val: '< 2h',     lbl: 'Average quote time' },
  { val: '24/7',     lbl: 'Pricing availability' },
  { val: '9 markets', lbl: 'Sub-Saharan Africa' },
]

const VX_FEATURES = [
  {
    eyebrow: '⚡ For Insurance Assessors',
    title: 'Stop guessing.\nStart defending\nevery claim line.',
    body: 'Our pricing engine aggregates real-time market data across thousands of transactions to establish a defensible benchmark for every part — OEM, aftermarket, or used.',
    bullets: [
      'Instant benchmark comparison (Low / Avg / High)',
      'Automated flagging of parts >15% above market',
      'One-click PDF audit reports for claim files',
      'Historical pricing trends by make, model & market',
    ],
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&q=80&auto=format&fit=crop',
    card: {
      title: '✓ Part Verified',
      rows: [
        { l: 'OEM No:',        v: '53711-42200',    cls: 'font-mono text-[#E8ECF1]' },
        { l: 'Condition:',     v: 'New OEM',         cls: 'text-blue-400' },
        { l: 'Invoice:',       v: 'GHS 1,850',       cls: 'text-[#E8ECF1]' },
        { l: 'Benchmark Avg:', v: 'GHS 1,720',       cls: 'text-[#E8ECF1]' },
        { l: 'Variance:',      v: '+7.6% — Review',  cls: 'text-red-400' },
      ],
    },
    imgLeft: true,
  },
  {
    eyebrow: '⚡ For Garages & Workshops',
    title: 'Every part.\nEvery dealer.\nOne search.',
    body: 'Find any part by OEM number, vehicle profile, or description across your entire dealer network. VelopX surfaces live stock and real-time price benchmarks — instantly.',
    bullets: [
      'OEM, aftermarket & used in one index',
      'Live stock status + market pricing',
      'Link purchases directly to job cards and claims',
    ],
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80&auto=format&fit=crop',
    card: null,
    imgLeft: false,
  },
  {
    eyebrow: '⚡ For Parts Dealers',
    title: 'Your catalogue.\nYour orders.\nYour dashboard.',
    body: 'List your full parts inventory with photos, OEM numbers, and pricing. Receive RFQs, manage orders, and dispatch with in-app proof of delivery — all in one place.',
    bullets: [
      'Bulk catalogue import or item-by-item listing',
      'Receive and respond to RFQs in real time',
      'In-app delivery confirmation + POD capture',
    ],
    img: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=80&auto=format&fit=crop',
    card: null,
    imgLeft: true,
  },
]

const VX_PARTS = [
  {
    name: 'Brake Disc Rotor',
    badge: 'OEM',
    badgeClass: 'bg-blue-500/20 text-blue-400',
    price: 'GHS 850',
    img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&q=80&auto=format&fit=crop',
  },
  {
    name: 'LED Headlight Assy',
    badge: 'USED',
    badgeClass: 'bg-amber-700/25 text-amber-400',
    price: 'GHS 4,200',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80&auto=format&fit=crop',
  },
  {
    name: 'Side Mirror Unit',
    badge: 'AFTERMKT',
    badgeClass: 'bg-purple-500/20 text-purple-400',
    price: 'GHS 1,150',
    img: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=500&q=80&auto=format&fit=crop',
  },
  {
    name: 'Front Bumper Cover',
    badge: 'OEM',
    badgeClass: 'bg-blue-500/20 text-blue-400',
    price: 'GHS 3,500',
    img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&q=80&auto=format&fit=crop',
  },
]

const VX_WHO = [
  { role: 'Parts Dealers',        desc: 'List your full catalogue. Receive RFQs and orders. Dispatch with in-app proof of delivery.',                               border: 'border-amber-500/25',   bar: 'bg-gradient-to-r from-amber-500/50 to-transparent' },
  { role: 'Garages',              desc: 'Search every dealer at once. Raise RFQs from a job card. Track parts right to your workshop door.',                       border: 'border-blue-500/25',    bar: 'bg-gradient-to-r from-blue-500/50 to-transparent' },
  { role: 'Insurance Assessors',  desc: 'Benchmark live market pricing. Request quotes directly. Validate parts against active insurance claims.',                  border: 'border-purple-500/25',  bar: 'bg-gradient-to-r from-purple-500/50 to-transparent' },
  { role: 'Insurance Companies',  desc: 'API access to aggregated data, claims analytics, and governance reporting. Full supply chain audit trail.',                border: 'border-emerald-500/25', bar: 'bg-gradient-to-r from-emerald-500/50 to-transparent' },
]

const VX_STEPS = [
  { n: '01', title: 'Search',  desc: 'Find parts by name, OEM number, or vehicle profile across all dealers.' },
  { n: '02', title: 'Quote',   desc: 'Send one RFQ to many dealers. Receive competitive, timestamped quotes.' },
  { n: '03', title: 'Order',   desc: 'Confirm the order. Parts dispatched with live driver tracking.' },
  { n: '04', title: 'Deliver', desc: 'Driver confirms handover. Claim updated. Audit trail complete.' },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  useEffect(() => {
    const els = document.querySelectorAll('.vx-reveal, .vx-reveal-l, .vx-reveal-r')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('vx-vis')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach((el) => { obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-[#070C14] text-white">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#070C14]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F5A623] flex items-center justify-center text-black font-black text-sm leading-none">⚡</div>
              <span className="text-[17px] font-extrabold tracking-tight">velop<span className="text-[#F5A623]">X</span></span>
            </div>
            <nav className="hidden lg:flex items-center gap-6 text-sm text-[#8A97AA] font-medium">
              <a href="#platform" className="hover:text-white transition-colors">Platform</a>
              <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
              <a href="#catalogue" className="hover:text-white transition-colors">Network</a>
              <a href="#api" className="hover:text-white transition-colors">API</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <a href="/sign-in" className="hidden sm:block text-sm text-[#8A97AA] hover:text-white transition-colors px-3 py-2">Sign In</a>
            <a href="/sign-up" className="text-sm font-bold bg-[#F5A623] text-black px-4 py-2 rounded-lg hover:bg-[#d4911f] transition-colors">Get Started →</a>
          </div>
        </div>
      </header>

      {/* overflow-x-hidden is on this inner wrapper, not the root, so sticky header works */}
      <div className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 min-h-[88vh] flex items-center">
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[15%] w-[700px] h-[500px] rounded-full bg-[#F5A623]/[0.055] blur-[130px]" />
          <div className="absolute top-[30%] right-[5%] w-[450px] h-[450px] rounded-full bg-blue-600/[0.05] blur-[100px]" />
        </div>

        <div className="relative w-full grid lg:grid-cols-2 gap-14 xl:gap-24 items-center">
          {/* Left — copy */}
          <div>
            <div className="vx-fade-up vx-d1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/25 text-[#F5A623] text-[11px] font-bold uppercase tracking-[0.12em] mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
              Governance-Grade Parts Infrastructure
            </div>
            <h1
              className="vx-fade-up vx-d2 font-extrabold tracking-tight leading-[1.03] mb-6"
              style={{ fontSize: 'clamp(2.4rem,4.8vw,4rem)' }}
            >
              The Motor Claims<br />
              <span className="text-[#F5A623]">Source of Truth.</span>
            </h1>
            <p className="vx-fade-up vx-d3 text-[#8A97AA] text-lg leading-relaxed max-w-lg mb-9">
              Replacing phone calls with auditable data. Connect dealers, garages, dispatchers, and insurers on one transparent marketplace — from RFQ to delivered part.
            </p>
            <div className="vx-fade-up vx-d4 flex flex-wrap gap-3 mb-10">
              <a href="/sign-up" className="px-7 py-3.5 rounded-xl bg-[#F5A623] text-black font-bold text-sm hover:bg-[#d4911f] transition-colors shadow-lg shadow-[#F5A623]/15">
                Request Demo →
              </a>
              <a href="#api" className="px-7 py-3.5 rounded-xl border border-[#1E2E48] text-[#E8ECF1] text-sm font-medium hover:border-[#F5A623]/40 transition-colors">
                Explore APIs
              </a>
            </div>
            <div className="vx-fade-up vx-d5 flex flex-wrap gap-6 text-[#506070] text-xs font-medium">
              <span className="flex items-center gap-1.5"><span className="text-green-400 text-sm">✓</span> Free to start</span>
              <span className="flex items-center gap-1.5"><span className="text-green-400 text-sm">✓</span> No credit card</span>
              <span className="flex items-center gap-1.5"><span className="text-green-400 text-sm">✓</span> API-first</span>
            </div>
          </div>

          {/* Right — animated benchmark card */}
          <div className="vx-slide-r vx-d5 vx-float hidden lg:block">
            <div className="rounded-2xl border border-[#253B5A] bg-[#0C1526] shadow-[0_32px_80px_rgba(0,0,0,0.65)] overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#1E2E48] bg-[#0B1220] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F5A623]/10 border border-[#F5A623]/20 flex items-center justify-center text-[#F5A623] flex-shrink-0">
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#E8ECF1] text-sm font-bold">Live Benchmark</p>
                  <p className="text-[#506070] text-[11px] mt-0.5">Claim #GH-9942 · Toyota RAV4 2022</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#506070] text-[10px] font-semibold uppercase tracking-wider">Mkt Avg</p>
                  <p className="text-[#E8ECF1] font-extrabold text-xl leading-tight">GHS 850</p>
                </div>
              </div>
              {/* Row 1 */}
              <div className="vx-qr1 px-5 py-3.5 border-b border-[#1E2E48] flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[#E8ECF1] text-sm font-semibold">Accra Auto Parts Ltd</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 uppercase tracking-wide">OEM</span>
                    <span className="text-green-400 text-[11px] font-medium">● In Stock</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#E8ECF1] font-extrabold">GHS 800</p>
                  <p className="text-[#F5A623] text-[11px] font-semibold mt-0.5 cursor-pointer">Select Quote</p>
                </div>
              </div>
              {/* Row 2 — best price highlight */}
              <div className="vx-qr2 px-5 py-3.5 border-b border-[#1E2E48] flex items-center gap-3 bg-[#F5A623]/[0.06]">
                <div className="flex-1 min-w-0">
                  <p className="text-[#E8ECF1] text-sm font-semibold">Tema Motors &amp; Repairs</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 uppercase tracking-wide">Aftermarket</span>
                    <span className="text-green-400 text-[11px] font-medium">● In Stock</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#F5A623] font-extrabold">GHS 620</p>
                  <p className="text-[#F5A623] text-[11px] font-bold mt-0.5 cursor-pointer">Best Price ★</p>
                </div>
              </div>
              {/* Row 3 */}
              <div className="vx-qr3 px-5 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[#E8ECF1] text-sm font-semibold">Salvage King GH</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 uppercase tracking-wide">Used</span>
                    <span className="text-green-400 text-[11px] font-medium">● In Stock</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#E8ECF1] font-extrabold">GHS 310</p>
                  <p className="text-[#F5A623] text-[11px] font-semibold mt-0.5 cursor-pointer">Select Quote</p>
                </div>
              </div>
              {/* Card footer */}
              <div className="px-5 py-3 border-t border-[#1E2E48] bg-[#0B1220] flex items-center justify-between">
                <span className="text-[#506070] text-[11px]">3 quotes received · expires in 47 min</span>
                <span className="text-[#F5A623] text-[11px] font-bold cursor-pointer hover:text-[#d4911f] transition-colors">Place Order →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Image marquee ── */}
      <div className="vx-marquee-wrap relative overflow-hidden border-y border-white/[0.06] py-5 bg-[#0C1526]/30">
        {/* Edge fade masks */}
        <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#070C14] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#070C14] to-transparent z-10 pointer-events-none" />
        <div className="vx-marquee flex gap-4" style={{ width: 'max-content' }}>
          {[...VX_MARQUEE, ...VX_MARQUEE].map((img, i) => (
            <div
              key={`${img.alt}-${i}`}
              className="flex-shrink-0 w-72 h-44 rounded-xl overflow-hidden ring-1 ring-white/[0.07]"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover"
                style={{ filter: 'brightness(0.55) saturate(0.6)' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="border-y border-white/5 bg-[#0C1526]/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-5">
            {VX_STATS.map((s, i) => (
              <div
                key={s.lbl}
                className={`vx-reveal px-6 py-8 text-center ${i < 4 ? 'border-r border-[#1E2E48]' : ''}`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <p className="text-2xl font-extrabold text-[#E8ECF1]">{s.val}</p>
                <p className="text-[#506070] text-xs mt-1.5">{s.lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature rows ── */}
      <div id="platform">
        {VX_FEATURES.map((f) => (
          <section key={f.eyebrow} className="border-b border-white/5 overflow-hidden">
            <div className={`max-w-7xl mx-auto flex flex-col ${f.imgLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
              {/* Photo side */}
              <div
                className={`relative lg:w-1/2 overflow-hidden ${f.imgLeft ? 'vx-reveal-l' : 'vx-reveal-r'}`}
                style={{ minHeight: 380 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.img}
                  alt={f.eyebrow}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'brightness(0.45) saturate(0.65)' }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: f.imgLeft
                      ? 'linear-gradient(to right, transparent 45%, #070C14 100%)'
                      : 'linear-gradient(to left, transparent 45%, #070C14 100%)',
                  }}
                />
                {f.card && (
                  <div className="absolute bottom-6 left-5 right-5 sm:left-auto sm:right-6 sm:w-72 bg-[#0C1526]/90 backdrop-blur-sm border border-[#253B5A] rounded-xl p-4">
                    <p className="text-green-400 text-sm font-bold mb-3">{f.card.title}</p>
                    <div className="space-y-1.5">
                      {f.card.rows.map((r) => (
                        <div key={r.l} className="flex justify-between gap-4 text-xs">
                          <span className="text-[#506070] font-mono">{r.l}</span>
                          <span className={`font-semibold ${r.cls}`}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Text side */}
              <div
                className={`lg:w-1/2 px-8 lg:px-16 py-16 flex flex-col justify-center ${f.imgLeft ? 'vx-reveal-r' : 'vx-reveal-l'}`}
              >
                <p className="text-[#F5A623] text-[11px] font-bold uppercase tracking-[0.14em] mb-4">{f.eyebrow}</p>
                <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight mb-5 whitespace-pre-line">
                  {f.title}
                </h2>
                <p className="text-[#8A97AA] text-base leading-relaxed mb-7">{f.body}</p>
                <ul className="space-y-3">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm text-[#8A97AA]">
                      <span className="text-[#F5A623] mt-0.5 leading-none">◈</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ── Parts catalogue ── */}
      <section className="max-w-7xl mx-auto px-6 py-24" id="catalogue">
        <div className="vx-reveal flex items-end justify-between mb-10">
          <div>
            <p className="text-[#F5A623] text-[11px] font-bold uppercase tracking-[0.14em] mb-3">Live from the platform</p>
            <h2 className="text-3xl font-extrabold tracking-tight">Comprehensive Coverage.</h2>
            <p className="text-[#8A97AA] text-sm mt-2">From engine blocks to fascias — all conditions, fully benchmarked.</p>
          </div>
          <a href="/sign-up" className="hidden sm:block text-sm font-semibold text-[#F5A623] hover:text-[#d4911f] transition-colors">
            Browse public catalogue →
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VX_PARTS.map((p, i) => (
            <div
              key={p.name}
              className="vx-reveal group rounded-2xl border border-[#1E2E48] bg-[#0C1526] overflow-hidden hover:border-[#F5A623]/35 cursor-pointer"
              style={{ transitionDelay: `${i * 0.08}s`, transition: 'border-color 0.2s ease, transform 0.2s ease, opacity 0.65s ease' }}
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-[#111E34]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.img}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ filter: 'brightness(0.65) saturate(0.7)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1526] via-[#0C1526]/10 to-transparent" />
                <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${p.badgeClass}`}>
                  {p.badge}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[#E8ECF1] text-sm font-semibold">{p.name}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0 ${p.badgeClass}`}>{p.badge}</span>
                </div>
                <p className="text-[#F5A623] text-xl font-extrabold mt-2">{p.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section id="solutions" className="border-t border-white/5 bg-[#0C1526]/30">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="vx-reveal text-center mb-14">
            <p className="text-[#F5A623] text-[11px] font-bold uppercase tracking-[0.14em] mb-3">Solutions</p>
            <h2 className="text-4xl font-extrabold tracking-tight">One platform.<br />Every stakeholder.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {VX_WHO.map((w, i) => (
              <div
                key={w.role}
                className={`vx-reveal relative rounded-2xl border ${w.border} bg-[#0C1526] p-8 overflow-hidden hover:bg-[#0F172A] transition-colors`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className={`absolute top-0 left-0 right-0 h-px ${w.bar}`} />
                <h3 className="text-[#E8ECF1] text-lg font-bold mb-3">{w.role}</h3>
                <p className="text-[#8A97AA] text-sm leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="vx-reveal text-center mb-14">
          <p className="text-[#F5A623] text-[11px] font-bold uppercase tracking-[0.14em] mb-3">How it works</p>
          <h2 className="text-4xl font-extrabold tracking-tight">From search to delivery.<br />In one platform.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 rounded-2xl overflow-hidden border border-[#1E2E48]">
          {VX_STEPS.map((s, i) => (
            <div
              key={s.n}
              className={`vx-reveal p-8 bg-[#0C1526] hover:bg-[#111E34] transition-colors ${i < 3 ? 'border-b sm:border-b-0 sm:border-r border-[#1E2E48]' : ''}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <p className="text-[#F5A623] font-mono text-xs font-bold mb-4 tracking-widest">{s.n}</p>
              <h3 className="text-[#E8ECF1] text-xl font-bold mb-3">{s.title}</h3>
              <p className="text-[#8A97AA] text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5A623]/[0.04] to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-[#F5A623]/[0.06] blur-[100px]" />
        </div>
        <div className="vx-reveal relative max-w-3xl mx-auto px-6 py-28 text-center">
          <h2 className="text-5xl font-extrabold tracking-tight mb-5">
            Ready to move at<br />
            <span className="text-[#F5A623]">velocity?</span>
          </h2>
          <p className="text-[#8A97AA] text-lg mb-10 max-w-xl mx-auto">
            Join dealers, garages, and insurers already on VelopX — the platform built to eliminate guesswork from the auto parts industry.
          </p>
          <a
            href="/sign-up"
            className="inline-block px-10 py-4 rounded-xl bg-[#F5A623] text-black font-bold text-base hover:bg-[#d4911f] transition-colors shadow-xl shadow-[#F5A623]/20"
          >
            Create your account →
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 text-sm text-[#506070]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#F5A623] flex items-center justify-center text-black font-black text-xs leading-none">⚡</div>
            <span className="font-extrabold text-[#E8ECF1] text-[15px]">velop<span className="text-[#F5A623]">X</span></span>
          </div>
          <span className="text-center">The intelligence layer that moves the auto parts industry.</span>
          <div className="flex gap-6">
            <a href="/sign-in" className="hover:text-white transition-colors">Sign In</a>
            <a href="/sign-up" className="hover:text-white transition-colors">Sign Up</a>
            <a href="http://localhost:3002" className="hover:text-white transition-colors">Status</a>
          </div>
        </div>
      </footer>
      </div>{/* end overflow-x-hidden */}
    </div>
  )
}
