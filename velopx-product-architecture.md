# VelopX — Product & Architecture Document

> Living document — updated as discussions evolve
> Started: April 22, 2026 | Last updated: April 24, 2026
> **Brand confirmed: VelopX** | Domains clean: velopx.com / velopx.io / velopx.co / velopx.africa

---

## 0. Brand Identity

### Name
**VelopX**

### The Story Behind the Name

**Velo** — from Latin *velocitas* — speed, velocity, movement. Vehicles. Parts in motion. Claims resolved fast. Deliveries tracked. The entire platform exists to remove friction and accelerate a broken, relationship-dependent process.

**X** — exchange, precision, intelligence. The crossroads where dealers, garages, assessors, and insurers all meet. The unknown solved. The marker of a platform that is smarter, faster, and more transparent than anything that came before it.

Together: **velocity meets intelligence.**

### One-Line Brand Statement
> *VelopX — the intelligence layer that moves the auto parts industry.*

### Brand Narrative
> The auto parts industry runs on phone calls, personal relationships, and guesswork. Claims take longer than they should. Prices are a mystery. Assessors work blind. VelopX changes that — a single intelligent platform where parts are found, priced, quoted, ordered, and tracked at velocity. Built for Africa. Built for the world.

### Product Family
| Product | What it is |
| --------------- | -------------------------------------------- |
| **VelopX** | The core platform |
| **VelopX API** | Enterprise integration layer |
| **VelopX Dealer** | Dealer storefront & catalogue app |
| **VelopX Assess** | Insurance assessor tools |
| **VelopX Track** | Delivery & logistics module |
| **VelopX Insight** | Analytics & intelligence dashboard |

### Domain Status
| Domain | Status |
| --------------- | --------- |
| `velopx.com` | ✅ Clean — **register immediately** |
| `velopx.io` | ✅ Clean |
| `velopx.co` | ✅ Clean |
| `velopx.africa` | ✅ Clean |

### Trademark Status & Registration Plan

**You need to register — here is exactly why and how:**

Registering `VelopX` as a trademark gives you the legal right to exclusively use the name in your industry in each jurisdiction. Without it, someone can register it after you go public and force a rebrand or take the domain. This is not optional if you are building a real business.

#### What to register
- The **wordmark**: `VelopX` (the name as text)
- The **logo mark**: once your logo is designed, register it separately
- Class **35** (marketplace / business services) and Class **42** (software / technology services) — both apply to this platform

#### Where to register — priority order

| Jurisdiction | Office | Why | Cost (approx) | Timeframe |
| ------------ | ------ | --- | ------------- | --------- |
| **Ghana** | GIPC (Ghana Intellectual Property Commission) | Phase 1 launch market | ~$150–250 | 6–12 months |
| **Kenya** | KIPI (Kenya Industrial Property Institute) | Phase 1 launch market | ~$150–250 | 6–12 months |
| **South Africa** | CIPC (Companies & Intellectual Property Commission) | Largest insurance market | ~$150–300 | 12–18 months |
| **Nigeria** | TRADEMARKS REGISTRY (via FIPO) | Largest population, Phase 2 | ~$200–350 | 12–24 months |
| **African Regional (ARIPO)** | ARIPO — covers 22 member states in one filing | Broadest Pan-Africa coverage | ~$800–1,200 | 18–24 months |
| **US / EU (EUIPO)** | USPTO / EUIPO | Protects API and enterprise deals with global clients | ~$300–600 each | 12–18 months |

#### Recommended approach
1. **Register Ghana + Kenya now** — cheapest, fastest, covers Phase 1
2. **File ARIPO** — single filing covers most of your expansion markets simultaneously. Best value for Pan-Africa coverage.
3. **US/EU** — do this before raising investment or signing enterprise deals with international insurers

#### Do this before going public
Trademark filing date is your priority date. File before you announce the product publicly, launch a website, or sign any commercial agreements. The earlier the filing date, the stronger your position if anyone challenges the name later.

> Engage a local IP attorney in Ghana or Kenya — costs $300–500 total for filing + professional fees for the first two markets. Worth every cent.

---

## 1. The Problem

Insurance companies currently have no centralised platform to discover spare parts pricing when processing motor vehicle claims. The entire process is informal, relationship-driven, and ungoverned.

### Pain Points

| Pain Point                                 | Impact                                             |
| ------------------------------------------ | -------------------------------------------------- |
| Manual phone calls for parts pricing       | Slow claims processing, high operational cost      |
| Personal relationships as the only channel | No standardization, bias risk, assessor dependency |
| No audit trail on price discovery          | Fraud exposure, zero governance                    |
| Assessors adjust invoices subjectively     | Inconsistent claim payouts, disputes               |
| New assessors disadvantaged                | Knowledge locked in relationships, not systems     |

### The Core Gap

There is **no single source of truth** for spare parts pricing in the motor claims ecosystem. Everything runs on informal, relationship-based networks.

---

## 2. The Vision

**VelopX** — a universal, modular, and scalable auto parts intelligence platform that bridges:

```
[Parts Dealers / Owners]
        ↓
  [VelopX]
        ↓
[Garages] ←→ [Insurance Assessors] ←→ [Insurance Companies]
        ↓
[Individual Buyers / Claimants]
```

### Guiding Principles

- **Universal first** — built to be country-agnostic and localizable from day one
- **Modular** — features can be enabled/disabled per market or user tier
- **Scalable** — architecture supports multi-region, multi-currency, multi-language
- **Data-rich** — every transaction and search generates analytics value
- **API-ready** — external systems (CMS, ERP, claims platforms) can integrate

---

## 3. Key Stakeholders & Their Roles

| Stakeholder                       | Role on Platform                                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Parts Dealers / Owners**        | List parts, manage storefront, receive orders, dispatch deliveries                                                                        |
| **Garages / Auto Mechanic Shops** | Onboard shop, search parts, raise RFQs, purchase, track inbound deliveries, confirm receipt, link parts to job cards and insurance claims |
| **Dispatchers / Drivers**         | Receive delivery jobs, navigate to buyer, confirm handover with proof of delivery                                                         |
| **Insurance Assessors**           | Search & benchmark prices, request quotes, validate parts against claims, track delivery status                                           |
| **Insurance Companies**           | Access aggregated pricing data, integrate via API, governance reporting, delivery oversight                                               |
| **Individual Buyers**             | Search and purchase parts directly (self-repair, private sales)                                                                           |

---

## 4. Parts Scope

The platform supports **all parts categories**:

- **OEM (Original Equipment Manufacturer)** — new, manufacturer-original
- **Aftermarket** — new, non-OEM alternatives
- **Second-hand / Used** — salvage, refurbished, pulled parts

Each listing must declare its condition category clearly. Pricing benchmarks will be calculated per category.

---

## 5. Revenue Model

### Dealer / Parts Owner

- Monthly or annual **subscription/listing fee** (tiered by catalogue size or features)
- **Transaction fee** per fulfilled order (percentage or flat rate)

### Insurance Companies

- **Per-claim API usage fee** — pay-as-you-go for price lookups tied to claims
- **Enterprise subscription** — flat monthly fee for unlimited assessor access + analytics dashboard

### Garages

- **Free tier** — basic search and quote requests
- **Premium tier** — order management, delivery tracking, bulk purchasing tools

### API / Data Products

- **API licensing** — sold to claims management systems (CMS), ERP platforms, fleet managers
- **Analytics reports** — market pricing trends, parts availability reports sold to insurers and industry bodies

---

## 6. Core Feature Modules

### 6.1 Dealer Storefront (Mobile App + Web)

- Onboard shop: name, location (GPS + address), contact info, operating hours
- Full parts catalogue management: upload parts with photos, descriptions, part numbers, vehicle compatibility, condition, price
- Inventory management: stock levels, availability toggles
- Order management: receive and manage incoming orders
- Delivery management: dispatch orders, assign delivery agents or integrate couriers

### 6.2 Parts Search & Discovery

- Search by: part name, part number, vehicle make/model/year/variant
- Filter by: condition (OEM/aftermarket/used), price range, location/proximity, dealer rating
- Results show: multiple dealers, pricing comparison, stock availability
- Price benchmarking: show market low / average / high per part

### 6.3 Quote & RFQ System

- Assessors and garages can send **Request for Quote (RFQ)** to multiple dealers simultaneously
- Dealers respond with quotes within a set timeframe
- Quotes logged with timestamps — full audit trail
- Assessors can reference quote history when adjusting claims

### 6.4 Order & Purchase Flow

- Add to cart / Buy Now
- Support for: cash on delivery, EFT, mobile money (per market)
- Purchase order generation for garages and insurers
- Invoice auto-generation for dealers

### 6.5 Dispatch & Delivery Lifecycle

The delivery chain is a first-class flow — tracked end-to-end by all parties involved.

#### Full Lifecycle

```
Dealer confirms order
        ↓
Dealer assigns dispatcher / driver (in Dealer App)
        ↓
Dispatcher receives job in Driver App
        ↓
Dispatcher marks "Collected from shop" → GPS timestamp logged
        ↓
Garage/buyer receives real-time tracking link (SMS + in-app)
        ↓
Dispatcher marks "Delivered" + captures proof (photo/signature)
        ↓
Garage confirms receipt in Garage App — condition check
        ↓
If issue → Dispute raised (wrong part / damaged / missing)
        ↓
Delivery event logged → Kafka → audit trail + analytics
```

#### Who Sees What

| Party                  | What They Can See                                                         |
| ---------------------- | ------------------------------------------------------------------------- |
| **Dealer**             | All their dispatches — status, dispatcher location, delivery confirmation |
| **Dispatcher/Driver**  | Their assigned deliveries, route, handover confirmation                   |
| **Garage/Buyer**       | Live tracking of inbound parts, ETA, proof of delivery                    |
| **Insurance Assessor** | Delivery status for parts tied to a specific claim reference              |
| **Insurance Company**  | Aggregated delivery performance across all claims on platform             |

#### Delivery Status States

```
PENDING → ASSIGNED → COLLECTED → IN_TRANSIT → DELIVERED → CONFIRMED
                                                         → DISPUTED
```

- Integration with local courier APIs per market (Phase 2)
- Direct dealer-to-buyer delivery (dealer owns their drivers) — Phase 1
- Proof of delivery: photo capture + recipient signature (mobile)
- Offline support: dispatcher app queues events locally, syncs on reconnect

### 6.6 Insurance Assessor Tools

- Price lookup tied to a specific claim reference
- Benchmark comparison vs. submitted invoice
- Flag inflated invoices automatically based on market data
- Exportable audit report per claim

### 6.7 Analytics & Reporting

- Parts pricing trends over time (per region, per vehicle type, per parts category)
- Dealer performance metrics
- Claims pricing deviation reports for insurers
- Market availability heatmaps

### 6.8 API Layer (Integration-Ready)

- RESTful APIs for:
  - Parts search & pricing
  - Quote requests
  - Order creation
  - Delivery status
  - Claims audit data
- Webhook support for real-time event notifications
- OpenAPI/Swagger documentation
- API key management portal for enterprise clients
- Rate-limiting and usage analytics per API consumer

### 6.9 Payments & Collections

Payments are treated as a first-class, Africa-first module. The platform abstracts all payment providers behind a single `PaymentService` interface — adding a new country or provider is a config + adapter change, not a rewrite.

#### Supported Payment Methods (by type)

| Method                  | Description                                      | Phase   |
| ----------------------- | ------------------------------------------------ | ------- |
| **Mobile Money**        | Primary method across Sub-Saharan Africa         | Phase 2 |
| **EFT / Bank Transfer** | Corporate accounts, garages, insurance companies | Phase 2 |
| **Card (Visa/MC)**      | Online card payments for web and mobile          | Phase 2 |
| **Cash on Delivery**    | Dealer-to-buyer, market-dependent                | Phase 2 |
| **Purchase Order**      | Garages and insurers — invoice-based settlement  | Phase 2 |

#### Mobile Money Coverage — Africa

| Provider               | Key Markets                                                        | Aggregator Access     |
| ---------------------- | ------------------------------------------------------------------ | --------------------- |
| **M-Pesa (Safaricom)** | Kenya, Tanzania, Mozambique, South Africa (Vodacom), DRC, Ethiopia | Flutterwave, DPO Pay  |
| **MTN Mobile Money**   | South Africa, Ghana, Uganda, Rwanda, Zambia, Ivory Coast, Cameroon | Flutterwave, Paystack |
| **Airtel Money**       | Kenya, Tanzania, Uganda, Rwanda, Zambia, Malawi, Nigeria, DRC      | Flutterwave, DPO Pay  |
| **Orange Money**       | Senegal, Ivory Coast, Mali, Cameroon, Madagascar                   | Flutterwave           |
| **Wave**               | Senegal, Ivory Coast, Mali, Burkina Faso                           | Direct API            |
| **EcoCash**            | Zimbabwe (dominant — ~85% digital payments)                        | DPO Pay, direct API   |
| **FNB eWallet**        | South Africa                                                       | Direct / Ozow         |

#### Payment Gateway Strategy

Rather than integrating each provider directly, the platform uses **aggregators** that handle multi-country mobile money, card, and bank transfer in a single integration:

| Gateway            | Strength                                                      | Priority    |
| ------------------ | ------------------------------------------------------------- | ----------- |
| **Flutterwave**    | Broadest pan-Africa coverage — mobile money, cards, EFT, USSD | Primary     |
| **Paystack**       | Deep West Africa (Nigeria, Ghana) — Stripe-owned, reliable    | Secondary   |
| **DPO Pay**        | Strong Eastern & Southern Africa coverage                     | Secondary   |
| **Peach Payments** | South Africa — card, EFT, QR                                  | SA-specific |
| **Ozow**           | South Africa — instant EFT                                    | SA-specific |

> **Default integration path:** Flutterwave as primary aggregator. Country configs determine which local fallback is activated per market.

#### Payment Lifecycle

```
Order Created
      ↓
Payment Initiated (method selected by buyer)
      ↓
Gateway / Provider Called → Pending confirmation
      ↓
Webhook received → Payment status update
      ↓
  COMPLETED → Order released to dealer for dispatch
  FAILED    → Buyer notified, order held
  REFUNDED  → Triggered by dispute resolution or return
```

#### Payment Status States

```
PENDING → PROCESSING → COMPLETED
                     → FAILED
                     → REFUNDED
                     → DISPUTED
```

#### PaymentService Architecture

```
PaymentService
  ├── initiatePayment(order, method, country)   → routes to correct provider
  ├── handleWebhook(provider, payload)          → updates payment status
  ├── refundPayment(paymentId, reason)          → reverse transaction
  └── getPaymentStatus(paymentId)               → polling fallback

Providers (interchangeable via interface):
  FlutterwaveAdapter
  PaystackAdapter
  DPOPayAdapter
  PeachPaymentsAdapter
  OzowAdapter
```

- All payment events published to Kafka → audit trail + analytics from day one
- PCI-DSS: card data never touches platform servers — tokenised via gateway
- Mobile money confirmations are async — UI shows pending state until webhook fires
- Purchase Order flow for garages: net-30 invoicing with manual settlement tracking

---

## 7. Confirmed Tech Stack

### Frontend

| Layer                           | Technology                 |
| ------------------------------- | -------------------------- |
| **Web App**                     | Next.js                    |
| **Mobile App (All User Types)** | React Native _(confirmed)_ |

### Backend

| Layer            | Technology                                        |
| ---------------- | ------------------------------------------------- |
| **API Services** | Node.js / TypeScript — Express or Fastify         |
| **API Gateway**  | Auth, rate limiting, routing, versioning (`/v1/`) |

### Databases

| Database             | Purpose                                                    | Phase    |
| -------------------- | ---------------------------------------------------------- | -------- |
| **PostgreSQL**       | Users, orders, payments, quotes, claims, audit trail       | Phase 1  |
| **PostgreSQL JSONB** | Parts catalogue attributes & vehicle compatibility         | Phase 1  |
| **MongoDB Atlas**    | Parts catalogue (migrated from JSONB), analytics data lake | Phase 2+ |
| **Redis**            | Caching, sessions, rate limiting                           | Phase 1  |

### Search

| Phase    | Technology                               | Cost                                |
| -------- | ---------------------------------------- | ----------------------------------- |
| Phase 1  | PostgreSQL Full-Text Search              | $0 — already in stack               |
| Phase 2+ | **Typesense** (self-hosted, open source) | $0 — Elasticsearch dropped entirely |

> **Why Typesense over Elasticsearch:** Same search quality for structured parts search (make/model/condition filters), typo-tolerant out of the box, fraction of the operational complexity and cost. Elasticsearch is never needed for this platform.

### Event Streaming

- **Kafka** — all significant platform events published from day one
- Phase 1: consumed internally by existing services only
- Phase 2: MongoDB consumer added to feed analytics data lake — **zero changes to existing services**

### Code Architecture Principles

- **Repository pattern** — all DB access behind interfaces; PostgreSQL → MongoDB swap is a config change, not a rewrite
- **API versioning** — `/v1/` from day one; analytics APIs added under `/v1/analytics/` in Phase 2+
- **JSONB strategy** — parts catalogue stored in document-shaped JSONB columns in Phase 1; Phase 2 migration to MongoDB is a straight export/import

---

## 8. Platform Architecture Overview

### Modular, Country-Agnostic Design

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                           │
│         (Auth, Rate Limiting, Routing, /v1/)             │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
   ┌───────▼──────┐           ┌───────▼──────────────────┐
   │  Web App     │           │  Mobile App              │
   │  (Next.js)   │           │  (React Native/Flutter)  │
   └──────────────┘           └──────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           Core Services (Node.js / TypeScript)           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Catalogue│  │ Orders & │  │ Quotes & │  │ Users  │  │
│  │ Service  │  │ Payments │  │   RFQ    │  │& Auth  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐   │
│  │ Delivery │  │Analytics │  │  Notifications       │   │
│  │ Tracking │  │& Reports │  │  (Push/SMS/Email)    │   │
│  └──────────┘  └──────────┘  └─────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Payments & Collections                          │   │
│  │  (Flutterwave / Paystack / DPO / Peach / Ozow)  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Audit Log & Intelligence Service               │   │
│  │  (API Gateway capture → Kafka → MongoDB Lake)   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│               Data & Integration Layer                   │
│                                                         │
│  Phase 1:                                               │
│  PostgreSQL (+ JSONB) │ Redis │ Kafka │ PostgreSQL FTS   │
│                                                         │
│  Phase 2+:                                              │
│  + MongoDB Atlas │ + Typesense │ Kafka → MongoDB Lake    │
│                                                         │
│  External:                                              │
│  Courier APIs │ Payment Gateways │ CMS/ERP via API       │
└─────────────────────────────────────────────────────────┘
```

### Multi-Country Support

- Multi-currency (per country/region config)
- Multi-language (i18n from day one)
- Country-specific: tax rules, delivery providers, payment methods
- Each country deployment shares the same codebase with locale config

### Key Architecture Decisions & Rationale

| Decision                              | Rationale                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| PostgreSQL as primary DB              | Relational integrity for orders/payments/claims is non-negotiable                                  |
| JSONB for parts catalogue             | Document-shaped from day one — Phase 2 MongoDB migration is export/import                          |
| Kafka from day one                    | Event seams built in — analytics lake plugs in Phase 2 without touching existing code              |
| Typesense over Elasticsearch          | Same search quality, zero cost, far less complexity — Elasticsearch never needed                   |
| PostgreSQL FTS in Phase 1             | Already in stack, good enough for MVP scale, no new system to run                                  |
| Repository pattern                    | DB swap is a config change, not a rewrite                                                          |
| MongoDB deferred to Phase 2           | De-risks Phase 1, spend justified by business growth                                               |
| Audit events via API Gateway          | 100% request coverage without touching individual services — single capture point                  |
| Native analytics (no Cube.js/PostHog) | Kafka + MongoDB aggregations replace third-party analytics stacks — zero new infra                 |
| Per-region compliance config          | PII retention rules, field masking, deletion policies driven by country config — POPIA, GDPR-ready |

### Cost Profile by Phase

| Phase       | Monthly Infra Estimate | What You're Paying For                                      |
| ----------- | ---------------------- | ----------------------------------------------------------- |
| **Phase 1** | ~$200–400/mo           | PostgreSQL (managed), Redis, Kafka (small), hosting         |
| **Phase 2** | ~$350–700/mo           | + MongoDB Atlas M10, Typesense (self-hosted)                |
| **Phase 3** | ~$600–1,200/mo         | + MongoDB analytics node, API portal, external integrations |

---

## 9. Mobile Apps — All User Types

The platform has **three distinct mobile app experiences**, each a first-class product. All three are built on the same codebase (React Native or Flutter) but surface different modules based on the authenticated user's role.

---

### 9.1 Dealer / Parts Owner App

The seller-side app. Manages the storefront, catalogue, orders, and dispatch.

| Screen                   | Key Actions                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Onboarding**           | Register shop, verify ID/documents, pin shop location on map, upload business license                      |
| **Catalogue Manager**    | Add/edit/remove parts, bulk CSV upload, barcode scan to auto-fill OEM number, multi-photo capture per part |
| **Orders Dashboard**     | Incoming orders, pending dispatch, completed orders, returns                                               |
| **Dispatch Manager**     | Assign dispatcher/driver to order, set expected delivery window, mark dispatched                           |
| **Dispatcher Live View** | Real-time map of active deliveries, driver status updates                                                  |
| **Analytics**            | Part views, quote requests received, sales performance, top-selling parts                                  |
| **Notifications**        | New orders, new RFQs, delivery updates, low stock alerts                                                   |

---

### 9.2 Garage / Auto Mechanic Shop App

The buyer-side app. Manages parts search, orders, job cards, and goods receipt. Used by panel garages working with insurance companies and walk-in repair shops.

#### Onboarding Flow (Mobile)

1. Register garage — business name, physical address, GPS location pin
2. Upload business registration / trade license
3. Add insurance company affiliations (panel garage registrations)
4. Add staff users — owner, parts buyer, workshop manager (role-based access)
5. Set preferred dealers / approved supplier lists

#### Key Screens & Flows

| Screen                   | Key Actions                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| **Job Cards**            | Create a job per vehicle (linked to VIN + claim reference), attach parts orders to job    |
| **Parts Search**         | Search by part name, OEM number, or VIN — vehicle profile auto-filters compatible parts   |
| **RFQ / Quote Requests** | Send quote requests to multiple dealers, compare responses, accept best quote             |
| **Orders Dashboard**     | Active orders, in-transit, completed, returns/disputes                                    |
| **Delivery Tracker**     | Real-time tracking of inbound parts — live map, ETA, driver contact                       |
| **Goods Receipt**        | Confirm parts received, capture condition photos, flag wrong/damaged parts                |
| **Dispute Raise**        | One-tap dispute: wrong part / damaged / not delivered — attaches photos + order reference |
| **Claims Linkage**       | Link received parts to a specific insurance claim reference for assessor visibility       |
| **Notifications**        | Order confirmed, dispatch alert, parts arriving soon, RFQ responses received              |

---

### 9.3 Dispatcher / Driver App

The logistics-side app. Used by delivery agents assigned to orders by the dealer or a courier partner.

| Screen                    | Key Actions                                                               |
| ------------------------- | ------------------------------------------------------------------------- |
| **My Deliveries**         | Queue of assigned deliveries for the day, sorted by route                 |
| **Active Delivery**       | Turn-by-turn navigation to delivery address, order details, contact buyer |
| **Handover Confirmation** | Capture recipient signature or photo proof of delivery                    |
| **Exception Reporting**   | Mark: recipient not available / address not found / refused delivery      |
| **Notifications**         | New delivery assigned, route updates, delivery deadline alerts            |

> The Dispatcher App is lightweight by design — optimised for low-data environments and works with intermittent connectivity (queues confirmation events locally, syncs when back online).

---

## 10. Open Questions & Next Steps

| #   | Question                                                   | Status                                    |
| --- | ---------------------------------------------------------- | ----------------------------------------- |
| 1   | Which country/market for MVP pilot?                        | **Confirmed** — see Section 14            |
| 2   | Primary tech stack decision                                | **Confirmed** — see Section 7             |
| 3   | Delivery: build own courier network or integrate existing? | **Confirmed** — see Section 15            |
| 4   | KYC/verification process for dealers                       | **Confirmed** — see Section 15 (Smile ID) |
| 5   | Dispute resolution process for orders                      | **Confirmed** — see Section 16            |
| 6   | Pricing engine: who sets the benchmark? Market average?    | **Confirmed** — see Section 17            |
| 7   | MVP feature scope                                          | **Confirmed** — see Section 11            |
| 8   | Mobile app framework: React Native or Flutter?             | **Confirmed** — React Native              |

---

## 11. Confirmed Phases

### Phase 1 — MVP (Market Validation)

**Markets:** Ghana, Kenya (see Section 14 for full country rollout map)
**Stack:** PostgreSQL + JSONB, Redis, Kafka (internal), PostgreSQL FTS
**Infra cost:** ~$200–400/mo

- Dealer onboarding + storefront (web + mobile) — Smile Identity KYC at onboarding
- Parts catalogue (OEM, aftermarket, second-hand) — stored in PostgreSQL JSONB
- Parts search & price discovery — powered by PostgreSQL FTS
- Quote/RFQ system with full audit trail
- Basic order flow
- Assessor price lookup + benchmark comparison
- Assessor audit report export (per claim)
- Kafka event publishing (all platform events, internal consumption only)
- API foundation (`/v1/`) with versioning, auth, rate limiting
- **Audit Log foundation** — every API gateway request writes an immutable audit event to Kafka → PostgreSQL audit table (see Section 13)

### Phase 2 — Full Commerce + Search Upgrade

**Stack:** + MongoDB Atlas, + Typesense, Kafka → MongoDB consumer
**Infra cost:** ~$350–700/mo

- **Payment & Collections** (see Section 6.9) — Flutterwave primary, mobile money (M-Pesa, MTN MoMo, Airtel Money, EcoCash, etc.), EFT, card, cash on delivery — per market config
- Delivery tracking (dealer → buyer, with proof of delivery)
- Catalogue migrated from JSONB → MongoDB (export/import, no logic change)
- Typesense replaces PostgreSQL FTS — typo-tolerant, fast, filterable
- Kafka → MongoDB consumer active — analytics data lake starts filling
- **Intelligence layer active** — audit events now flowing into MongoDB; aggregation pipelines power dashboards (see Section 13)
- Insurer-facing intelligence dashboard — assessor activity, claim benchmarking, delivery performance scoped per organisation
- Dealer ratings & reviews
- Insurance company dashboard

### Phase 3 — Data Platform & Integrations

**Stack:** + MongoDB analytics node, API developer portal
**Infra cost:** ~$600–1,200/mo

- Public API developer portal + API key self-service
- Analytics APIs — pricing trends, benchmarks, availability heatmaps
- CMS/ERP integration packages
- Advanced reporting for insurers (claims deviation, fraud flags)
- **Platform owner intelligence dashboard** — full cross-organisation, cross-country view for internal ops and business analysis
- **Retrospective anomaly reports** — unusual assessor activity, pricing outliers, suspicious transaction patterns (query-based, not real-time alerts)
- Multi-country rollout (locale config per market)
- Webhook platform for real-time event subscriptions

---

## 12. Visual Identification & External API Intelligence Layer

Getting the right part confirmed visually is critical — wrong part ordered = failed repair, returned goods, disputed claim. The platform combines three layers to solve this.

### The Three Rings

```
┌─────────────────────────────────────────────────────────┐
│           VEHICLE RING — Who is the car?                │
│         NHTSA vPIC (VIN decode) + CarQuery              │
│              make / model / year / engine               │
└───────────────────────┬─────────────────────────────────┘
                        │ feeds into
┌───────────────────────▼─────────────────────────────────┐
│         FITMENT RING — What parts fit it?               │
│      CarQuery compatibility + Dealer ACES data          │
│         part number ←→ vehicle compatibility            │
└───────────────────────┬─────────────────────────────────┘
                        │ feeds into
┌───────────────────────▼─────────────────────────────────┐
│       VISUAL RING — Is this the right part?             │
│    Dealer photos + Barcode scan + Google Vision AI      │
│         confirm identity visually before purchase       │
└─────────────────────────────────────────────────────────┘
```

### External APIs Used

| API                            | Purpose                                                      | Cost                                  | Phase   |
| ------------------------------ | ------------------------------------------------------------ | ------------------------------------- | ------- |
| **NHTSA vPIC**                 | VIN decode → make/model/year/engine/variant                  | $0                                    | Phase 1 |
| **CarQuery**                   | Vehicle make/model/year/trim dropdown data, global coverage  | $0                                    | Phase 1 |
| **ML Kit (Google, on-device)** | Barcode/QR scan of part number label — no API call           | $0                                    | Phase 1 |
| **Google Vision API**          | Photo-based part matching against catalogue images           | Free tier 1k/mo, then ~$1–2/1k images | Phase 2 |
| **AWS Rekognition**            | Alternative to Google Vision                                 | Free tier 5k images/mo (12 months)    | Phase 2 |
| **TecDoc / ACES**              | Professional fitment database (part → vehicle compatibility) | Paid                                  | Phase 3 |

### User Journey — Combined API Flow

**Entry Point 1: User has a VIN (insurance claims)**

```
1. User enters VIN
2. NHTSA vPIC → decodes: Toyota Corolla 2005, 1.8L 4-cyl, ZZE122 variant
3. CarQuery → enriches: trim level, transmission, region spec
4. VehicleProfile stored in Redis (cache — no repeat API calls)
5. Catalogue filtered: only parts tagged compatible with ZZE122 1.8L
6. Results show: dealer photos, OEM part numbers, condition badges, price comparison
7. User confirms via barcode scan (mobile) OR photo upload → Google Vision match
```

**Entry Point 2: No VIN (garage walk-in, individual buyer)**

```
1. User selects Make → Model → Year → Variant via cascading dropdowns
2. CarQuery powers the dropdown data
3. Continues from step 5 above
```

**Entry Point 3: Assessor has part number from invoice**

```
1. Assessor enters OEM part number (e.g. 53711-02190)
2. Platform cross-references catalogue — returns all dealers + prices + conditions
3. Also returns compatible vehicle list (reverse fitment check)
4. Assessor validates invoice part number matches claimed vehicle — full audit trail
```

### The VehicleProfile Object (Audit Anchor)

All three APIs normalise into one internal object, cached in Redis:

```json
{
  "vin": "JTDBT923551234567",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2005,
  "variant": "ZZE122",
  "engine": "1.8L 4-cyl 1ZZ-FE",
  "transmission": "Automatic",
  "region": "ZA",
  "decoded_at": "2026-04-23T09:00:00Z"
}
```

Every part search, quote, and claim carries this profile. Assessors cannot reference a part for a vehicle it does not fit. This is the governance control built into the platform at the data level.

### Internal Service Design

```
VehicleIntelligenceService
  ├── decodeVIN(vin)              → NHTSA vPIC + CarQuery enrichment
  ├── getVehicleCascade()         → CarQuery dropdown data
  └── getCompatibleParts()        → filtered catalogue query

VisualIdentityService
  ├── scanBarcode(imageData)      → ML Kit (on-device, $0)
  └── matchPartPhoto(imageData)   → Google Vision API (Phase 2)
```

### Dealer Responsibilities (Enforced at Onboarding)

Visual confirmation only works if dealers supply quality data. The onboarding flow **enforces**:

- Minimum 3 photos per part (front, back, part number label)
- OEM part number (mandatory field)
- Condition declaration (OEM / aftermarket / used)
- Vehicle compatibility fitment tags (make/model/year/variant)
- For used parts: visible wear/condition photos required

---

_Document continues to evolve as product discussions progress._

---

## 13. Audit Log & Intelligence Platform

Every meaningful action on the platform is captured, stored, and made queryable. This serves two distinct purposes — **compliance & governance** (immutable audit trail) and **business intelligence** (retrospective analytics and reporting).

No new infrastructure is added. The full capability is built on the existing stack: **API Gateway → Kafka → PostgreSQL (Phase 1) → MongoDB (Phase 2+)**.

---

### 13.1 What Gets Captured

The **API Gateway** is the single capture point — every inbound request passes through it, ensuring 100% coverage without instrumenting individual services.

#### Audit Event Schema

```json
{
  "event_id": "uuid",
  "timestamp": "2026-04-24T10:30:00Z",

  "actor": {
    "user_id": "usr_abc123",
    "role": "assessor",
    "organisation_id": "org_xyz",
    "organisation_type": "insurance_company"
  },

  "action": {
    "type": "PRICE_LOOKUP",
    "resource": "parts/catalogue",
    "resource_id": "part_456",
    "claim_reference": "CLM-2026-00123",
    "outcome": "SUCCESS"
  },

  "device": {
    "type": "mobile",
    "os": "Android 14",
    "app_version": "2.1.0",
    "user_agent": "VelopX-Android/2.1.0"
  },

  "network": {
    "ip": "[hashed — PII policy]",
    "country": "ZA",
    "city": "Johannesburg",
    "region": "Gauteng"
  },

  "session_id": "sess_789",
  "request_id": "req_101112",
  "latency_ms": 142
}
```

> Raw IP addresses are hashed before storage. Country, city, and region are derived at capture time and stored in plain text — location intelligence without PII exposure.

#### Tracked Action Types

| Category         | Action Types                                                                          |
| ---------------- | ------------------------------------------------------------------------------------- |
| **Parts**        | SEARCH, VIEW, PRICE_LOOKUP, BENCHMARK_COMPARE                                         |
| **Quotes / RFQ** | RFQ_SENT, QUOTE_RECEIVED, QUOTE_ACCEPTED, QUOTE_DECLINED                              |
| **Orders**       | ORDER_CREATED, ORDER_CONFIRMED, ORDER_CANCELLED, PAYMENT_INITIATED, PAYMENT_COMPLETED |
| **Delivery**     | DISPATCH_ASSIGNED, COLLECTED, IN_TRANSIT, DELIVERED, CONFIRMED, DISPUTED              |
| **Claims**       | CLAIM_REFERENCE_LINKED, INVOICE_VALIDATED, AUDIT_REPORT_EXPORTED                      |
| **Auth**         | LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_RESET, SESSION_EXPIRED                          |
| **Admin**        | USER_CREATED, USER_SUSPENDED, ROLE_CHANGED, DEALER_APPROVED, DEALER_SUSPENDED         |
| **Catalogue**    | PART_LISTED, PART_UPDATED, PART_REMOVED, STOCK_UPDATED                                |

---

### 13.2 Storage Strategy by Phase

#### Phase 1 — PostgreSQL Audit Table

- All audit events written to a dedicated `audit_events` table in PostgreSQL
- Append-only — no updates or deletes permitted at the application layer
- Indexed on: `user_id`, `organisation_id`, `action_type`, `timestamp`, `claim_reference`
- Kafka publishes the event; an internal consumer writes it to PostgreSQL
- Retention: configurable per country (e.g. 7 years for South Africa / POPIA)

#### Phase 2 — MongoDB Analytics Lake

- Kafka → MongoDB consumer activated (same pattern as general analytics)
- Audit events land in MongoDB alongside all other platform events
- MongoDB aggregation pipelines power all dashboard queries
- PostgreSQL audit table retained as the compliance source of truth
- MongoDB used for analytics and reporting — fast aggregations, flexible queries

```
API Gateway
    │  (every request)
    ▼
  Kafka (audit_events topic)
    │
    ├── PostgreSQL consumer → audit_events table (Phase 1+, compliance SoT)
    └── MongoDB consumer   → analytics.audit_events collection (Phase 2+, dashboards)
```

---

### 13.3 Intelligence Service

```
AuditIntelligenceService
  ├── logEvent(context)                  → publishes to Kafka audit topic
  ├── getActivityByOrg(orgId, filters)   → scoped insurer dashboard queries
  ├── getActivityByUser(userId, filters) → individual assessor/dealer drill-down
  ├── getPlatformOverview(filters)       → full cross-org platform owner view
  ├── getDeviceBreakdown(filters)        → mobile vs desktop, OS, app version
  ├── getGeoActivity(filters)            → country / region / city heatmap data
  ├── getConversionFunnel(filters)       → search → quote → order → payment rates
  └── exportComplianceReport(orgId, claimRef) → per-claim audit export (assessors)
```

All queries exposed via `/v1/analytics/` API routes — consumed by custom Next.js dashboards.

---

### 13.4 Dashboard Tiers

Two completely separate dashboard views, both built in Next.js, both consuming `/v1/analytics/`.

#### Tier 1 — Insurer-Facing Dashboard

Scoped strictly to the authenticated organisation. An insurer can only see their own data.

| Report                        | What It Shows                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------- |
| **Assessor Activity**         | All lookups, quotes, and claim actions by each assessor — volume, timing      |
| **Claims Benchmark Report**   | Submitted invoice price vs. platform market price — deviation flagged         |
| **Parts Usage by Claim**      | Full parts trail per claim reference — parts searched, quoted, ordered        |
| **Delivery Performance**      | Delivery times, confirmation rates, dispute rates for parts on their claims   |
| **Device & Session Overview** | Which assessors are on mobile vs desktop, app versions in use                 |
| **Audit Export**              | Downloadable per-claim compliance report with full event trail and timestamps |

#### Tier 2 — Platform Owner Dashboard (Internal)

Full cross-organisation, cross-country view. Accessible only to platform operators.

| Report                         | What It Shows                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| **Platform Activity Overview** | All transactions, searches, orders, payments — by country, region, organisation          |
| **User Behaviour Funnels**     | Search → quote → order → payment conversion rates — where users drop off                 |
| **Device & Client Breakdown**  | Mobile (iOS/Android) vs web (desktop/laptop), app version distribution                   |
| **Geographic Heatmap**         | Activity by country, city, region — where platform is most used                          |
| **Assessor Anomaly Report**    | Retrospective: assessors with unusually high lookup volumes, multi-country sessions      |
| **Dealer Performance**         | Order fulfilment rates, average dispatch times, dispute rates per dealer                 |
| **Revenue Analytics**          | Transaction fees, subscription revenue, API usage fees — per org, per country, over time |
| **Pricing Intelligence**       | Market price trends per part, per category, per region — over time                       |

---

### 13.5 Per-Region Compliance Configuration

PII handling, retention periods, and field masking are driven by a **country compliance config** — no code changes required when expanding to a new market.

```ts
// compliance.config.ts
const complianceRules: Record<string, ComplianceConfig> = {
  ZA: {
    regulation: "POPIA",
    retentionYears: 7,
    maskFields: ["ip", "device_id"],
    geoResolution: "city", // store city — not GPS coords
    requiresConsentLog: true,
  },
  KE: {
    regulation: "Kenya Data Protection Act",
    retentionYears: 5,
    maskFields: ["ip"],
    geoResolution: "region",
    requiresConsentLog: true,
  },
  NG: {
    regulation: "NDPR",
    retentionYears: 5,
    maskFields: ["ip", "device_id"],
    geoResolution: "city",
    requiresConsentLog: false,
  },
  // new country = new config block, zero code change
};
```

- Field masking applied at the **API Gateway capture point** — PII never enters Kafka raw
- Retention enforcement: a scheduled job queries `audit_events` and purges records older than the configured period for each country
- All masking and retention decisions are logged themselves (meta-audit trail)

---

### 13.6 What This Costs

| Phase   | New Infrastructure                                    | Cost     |
| ------- | ----------------------------------------------------- | -------- |
| Phase 1 | None — `audit_events` table in existing PostgreSQL    | $0 extra |
| Phase 2 | None — existing Kafka → MongoDB consumer extended     | $0 extra |
| Phase 3 | None — analytics API routes added to existing service | $0 extra |

The entire Audit Log & Intelligence capability is built on infrastructure already in the stack. Zero additional services, zero additional monthly cost.

---

## 14. Market Rollout Strategy

### MVP Pilot Markets — Ghana & Kenya

Ghana and Kenya are the confirmed Phase 1 launch markets. Both have active motor insurance industries, strong mobile money penetration, and a growing middle class with car ownership. They serve as the best African mirrors for the broader rollout — what works here works across the continent.

| Market    | Why                                                                                        | Mobile Money           | Language          | Currency | Compliance                     |
| --------- | ------------------------------------------------------------------------------------------ | ---------------------- | ----------------- | -------- | ------------------------------ |
| **Ghana** | Active insurance market, strong MTN MoMo + Airtel adoption, NIA ID infrastructure          | MTN MoMo, Airtel Money | English           | GHS      | Data Protection Act 2012       |
| **Kenya** | Most sophisticated motor claims market in East Africa, M-Pesa dominance, NTSA vehicle data | M-Pesa (Safaricom)     | English / Swahili | KES      | Kenya Data Protection Act 2019 |

### Phase 2+ Expansion Markets

Grouped by regional cluster — same codebase, locale config per market:

#### East Africa

| Country      | Key Insurer Market | Mobile Money             | Currency | Notes                            |
| ------------ | ------------------ | ------------------------ | -------- | -------------------------------- |
| **Tanzania** | Growing            | M-Pesa (Vodacom), Airtel | TZS      | Shares vehicle makes with Kenya  |
| **Uganda**   | Active             | MTN MoMo, Airtel         | UGX      | Panel garage culture established |
| **Rwanda**   | Growing            | MTN MoMo                 | RWF      | Strong regulatory environment    |
| **Ethiopia** | Emerging           | Telebirr, M-Pesa         | ETB      | Largest population in region     |

#### West Africa

| Country         | Key Insurer Market | Mobile Money                    | Currency | Notes                                 |
| --------------- | ------------------ | ------------------------------- | -------- | ------------------------------------- |
| **Nigeria**     | Largest in Africa  | MTN MoMo, Airtel, bank transfer | NGN      | Paystack primary here; massive market |
| **Ivory Coast** | Active             | Orange Money, MTN MoMo          | XOF      | French-language localisation needed   |
| **Senegal**     | Growing            | Wave, Orange Money              | XOF      | Wave dominant — direct API            |

#### Southern Africa

| Country          | Key Insurer Market | Mobile Money / Payment         | Currency  | Notes                                   |
| ---------------- | ------------------ | ------------------------------ | --------- | --------------------------------------- |
| **South Africa** | Most mature        | Ozow (EFT), FNB eWallet, Peach | ZAR       | POPIA compliance; largest claims market |
| **Zimbabwe**     | Active             | EcoCash (~85% digital)         | USD / ZiG | EcoCash dominates completely            |
| **Zambia**       | Growing            | MTN MoMo, Airtel               | ZMW       | Panel garage model well established     |
| **Mozambique**   | Emerging           | M-Pesa (Vodacom)               | MZN       | —                                       |

### Country Config Model

Every market is activated by a config block — no code fork required:

```ts
// markets/ghana.config.ts
export const ghanaConfig: MarketConfig = {
  countryCode: "GH",
  currency: "GHS",
  languages: ["en"],
  paymentMethods: ["mtn_momo", "airtel_money", "card", "cash_on_delivery"],
  primaryPaymentGateway: "flutterwave",
  kycProvider: "smile_identity",
  supportedIdTypes: ["ghana_card", "voter_id", "passport"],
  compliance: {
    regulation: "Ghana Data Protection Act 2012",
    retentionYears: 7,
    maskFields: ["ip", "device_id"],
  },
  vehicleData: {
    vinDecoder: "nhtsa_vpic",
    registrationAuthority: "DVLA Ghana",
  },
};
```

New country = new config file. Feature flags handle anything market-specific (e.g. EcoCash-only Zimbabwe, Wave-heavy Senegal).

---

## 15. Delivery Model & KYC

### 15.1 Delivery Model — Dealer-Owned Dispatch (Option A)

The platform is a **logistics enabler**, not a logistics provider. The platform provides the tooling; dealers own their drivers and delivery operations. This keeps liability clean and cost zero for the platform.

#### How It Works

```
Dealer employs / contracts their own drivers
        ↓
Dealer assigns driver to order in Dealer App
        ↓
Driver onboarded to Dispatcher App (platform provides app, not employment)
        ↓
Platform handles: dispatch assignment, GPS tracking, proof of delivery, audit trail
        ↓
Dealer is fully responsible for their delivery operation — platform is the tool
```

#### Platform Responsibilities

- Dispatcher App (tracking, PoD capture, offline sync)
- Delivery event publishing to Kafka (audit trail)
- Real-time tracking visible to buyer/garage/assessor
- Dispute recording (wrong part, damaged, not delivered)

#### Dealer Responsibilities

- Employing or contracting their delivery agents
- Ensuring drivers are trained on Dispatcher App
- Delivery timelines, damaged goods, lost deliveries — their liability
- Clearly stated in dealer Terms of Service (see Section 16)

#### Courier Partner Integration (Phase 2+)

The architecture is designed to accept courier API adapters. When a market has established courier partners (e.g. Sendy in Kenya, DHL Express), dealers can opt to use integrated couriers instead of their own drivers. This is a config + adapter addition — zero changes to existing delivery logic.

```
CourierIntegrationService
  ├── assignToCourier(orderId, provider)   → Sendy / DHL / local partner
  ├── trackCourierShipment(trackingRef)    → normalised delivery status
  └── receiveCourierWebhook(provider, payload) → maps to platform delivery states
```

### 15.2 KYC — Smile Identity

**Smile Identity** is the confirmed KYC provider. Purpose-built for Africa, covering all target markets in a single API integration.

#### Why Smile Identity

- Built specifically for African ID infrastructure — not a global provider retrofitted for Africa
- Supports government ID verification + selfie liveness check in one API call
- Real-time verification results
- GDPR/POPIA-compatible data handling
- Competitive pricing at scale

#### Coverage Across Target Markets

| Country          | Supported ID Types                                         |
| ---------------- | ---------------------------------------------------------- |
| **Ghana**        | Ghana Card (NIA), Voter ID, Passport                       |
| **Kenya**        | National ID, KRA PIN, Passport                             |
| **Nigeria**      | NIN (National ID), BVN (Bank Verification), CAC (business) |
| **South Africa** | DHA (Home Affairs), CIPC (business registration)           |
| **Uganda**       | National ID, Passport                                      |
| **Tanzania**     | NIDA National ID, Passport                                 |
| **Rwanda**       | National ID, Passport                                      |
| **Zimbabwe**     | National ID, Passport                                      |
| **Zambia**       | National ID, Passport                                      |

#### KYC Flow — Dealer Onboarding

```
Dealer registers on platform
        ↓
Business details submitted (name, address, contact)
        ↓
Smile Identity called:
  - ID document photo upload
  - Selfie liveness check
  - Business registration document (where applicable)
        ↓
Smile Identity returns: APPROVED / PENDING_REVIEW / REJECTED
        ↓
APPROVED → dealer account activated, catalogue enabled
PENDING_REVIEW → manual review queue for platform ops team
REJECTED → dealer notified with reason, can resubmit
        ↓
KYC event published to Kafka → audit trail
```

#### KYC Service

```
KYCService
  ├── submitVerification(dealerId, idDocs, selfie)  → Smile Identity API
  ├── handleVerificationWebhook(payload)            → updates dealer KYC status
  ├── getKYCStatus(dealerId)                        → current verification state
  └── escalateToManualReview(dealerId, reason)      → ops queue
```

KYC status states: `PENDING → IN_REVIEW → APPROVED / REJECTED / RESUBMISSION_REQUIRED`

---

## 16. Dispute Resolution & Platform Legal Position

### 16.1 Platform Legal Position — Marketplace Enabler

Spare Parts Hub operates strictly as a **technology marketplace and enabler**. The platform:

- Does **not** manufacture, stock, or own any parts
- Does **not** employ delivery agents or operate vehicles
- Does **not** hold buyer funds or act as a payment intermediary (payments flow dealer ↔ buyer via Flutterwave; platform collects its transaction fees separately)
- Does **not** make representations about part quality, compatibility, or fitness for purpose beyond what the dealer declares
- Is **not** a party to the transaction between dealer and buyer

This position mirrors established marketplace law (Airbnb, Jumia, Takealot model) and is the cleanest legal posture across all African jurisdictions. It must be clearly and unambiguously stated in platform Terms of Service.

### 16.2 Dispute Process

Even as a non-party enabler, the platform provides a structured mediation process as a service to its users. Resolution authority rests with the parties — the platform facilitates, documents, and can suspend bad actors.

#### Dispute Categories

| Type                    | Description                                             | Who Initiates      |
| ----------------------- | ------------------------------------------------------- | ------------------ |
| **Wrong Part**          | Part received does not match what was ordered           | Garage / Buyer     |
| **Damaged on Delivery** | Part arrived damaged or broken                          | Garage / Buyer     |
| **Not Delivered**       | Order marked delivered but not received                 | Garage / Buyer     |
| **Incorrect Listing**   | Dealer listed part incorrectly (wrong number/condition) | Platform Ops       |
| **Invoice Dispute**     | Submitted price does not match platform benchmark       | Assessor / Insurer |

#### Dispute Lifecycle

```
Buyer/garage raises dispute (one-tap in app — attaches photos + order reference)
        ↓
Dispute logged → Kafka → audit trail
        ↓
Dealer notified — 48-hour response window
        ↓
Dealer responds: accepts / contests
        ↓
  ACCEPTED → Dealer initiates replacement or refund directly to buyer
  CONTESTED → Platform Ops reviews evidence (photos, delivery proof, chat logs)
        ↓
Platform Ops recommendation issued — parties notified
        ↓
  Resolved → Dispute closed, outcome logged
  Unresolved → Parties referred to local consumer protection authority
        ↓
Dispute outcome published to dealer performance record (affects rating)
```

#### Platform's Role in Disputes

- Provides the evidence trail (photos, GPS delivery data, timestamps, audit log)
- Issues a **non-binding recommendation** — platform does not compel payment or return
- Can **suspend a dealer** pending investigation of repeated disputes
- Can **flag an assessor** for pattern abuse (systematic invoice manipulation)
- All dispute events are immutably logged (Section 13)

#### Platform Does NOT

- Compel refunds or replacements (that is between dealer and buyer)
- Guarantee part quality or fitness for purpose
- Arbitrate insurance claim values
- Accept liability for delivery failures

### 16.3 Terms of Service — Key Positions to be Enshrined

> Full legal drafting requires a qualified attorney. These are the confirmed product/business positions to inform legal drafting:

| Clause Area                  | Platform Position                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| **Platform role**            | Technology marketplace intermediary only — not a party to any transaction                           |
| **Parts quality**            | Dealers solely responsible for accuracy of listings, condition, and compatibility declarations      |
| **Delivery liability**       | Dealers solely responsible for delivery operations and delivery agents they employ or contract      |
| **Payment**                  | Platform collects transaction/service fees only — not an escrow agent, not a payment intermediary   |
| **Dispute resolution**       | Platform provides facilitation and evidence tools only — non-binding mediation, not arbitration     |
| **Data & privacy**           | Per-country compliance (POPIA, Kenya DPA, Ghana DPA, NDPR) — users consent at registration          |
| **KYC**                      | Platform verifies dealers via Smile Identity — not a guarantee of dealer trustworthiness            |
| **Liability cap**            | Platform liability capped at fees paid to platform in preceding 12 months                           |
| **Suspension / termination** | Platform reserves right to suspend or remove any user for breach, fraud, or repeated dispute flags  |
| **Governing law**            | To be determined per market — likely Ghana / Kenya for Phase 1 with jurisdiction clause per country |

---

## 17. Pricing Benchmark Engine

### 17.1 Design Philosophy

The benchmark engine serves two masters: **market fairness** (what is the honest prevailing price?) and **platform health** (platform fees are cleanly separated and always visible). The two are never conflated.

Platform fees are a transparent layer **on top of** the benchmark — never baked into it.

### 17.2 Benchmark Calculation — Hybrid Model

The engine uses a **hybrid approach**: admin-seeded floor prices at launch, graduating to market-derived averages as transaction data matures.

```
Phase 1 — Seeded Mode (MVP launch, thin data)
  Admin sets: Floor price, Ceiling price, Reference price
  Source: market research, dealer interviews, insurer submissions
  Used when: fewer than N confirmed transactions exist for that part

Phase 2 — Blended Mode (growing data)
  Benchmark = weighted average of:
    - Admin reference price (weight decreases as data grows)
    - Platform transaction data (weight increases as data grows)
  Threshold: configurable per part category (e.g. N=50 transactions)

Phase 3 — Market Mode (mature data)
  Benchmark = purely platform-derived market data
  Admin reference price retired for high-volume parts
  Admin can still override for specific parts or categories
```

### 17.3 Benchmark Components

For every part (by part number + condition category):

| Component           | Description                                                             |
| ------------------- | ----------------------------------------------------------------------- |
| **Market Floor**    | Lowest credible price in the market (filters out outliers)              |
| **Market Average**  | Volume-weighted average of confirmed transaction prices                 |
| **Market Ceiling**  | 95th percentile — flags anything above this as potentially inflated     |
| **Reference Price** | Admin-set anchor (used in Phase 1 / low-data scenarios)                 |
| **Benchmark Band**  | Floor → Average → Ceiling displayed to assessors for invoice validation |

### 17.4 Platform Fee Layer

Platform fees are configured separately from benchmark prices and are always visible to all parties. Never embedded in displayed prices.

```ts
// pricing/fees.config.ts
export const feeConfig: FeeConfig = {
  transactionFeePercent: 2.5, // % of order value — charged to dealer
  assessorLookupFee: 0, // free for assessors — revenue from insurer subscription
  rfqProcessingFee: 0, // free — drives adoption
  premiumListingFeeMonthly: 50, // USD — dealer catalogue premium tier
  apiCallFeePerLookup: 0.05, // USD — insurance company pay-as-you-go
  enterpriseSubscriptionMonthly: 500, // USD — flat rate unlimited assessor access
};
```

Fee config is per-market adjustable — Ghanaian fee structure can differ from South African without code changes.

### 17.5 PricingEngineService

```
PricingEngineService
  ├── getBenchmark(partNumber, condition, country)
  │     → returns { floor, average, ceiling, source, confidence }
  ├── calculateOrderTotal(orderId)
  │     → applies transaction fee, returns itemised breakdown
  ├── validateInvoice(invoiceAmount, partNumber, condition, country)
  │     → returns { withinBand: bool, deviation: %, flag: LOW|OK|HIGH|CRITICAL }
  ├── updateBenchmark(partNumber, confirmedTransactionPrice)
  │     → called post-order-confirmation to feed market data
  └── adminOverride(partNumber, referencePrice, reason)
        → full audit trail on all admin overrides
```

### 17.6 Invoice Validation — Assessor Workflow

```
Assessor submits invoice for review
        ↓
PricingEngineService.validateInvoice() called
        ↓
Invoice amount compared to benchmark band (floor / average / ceiling)
        ↓
  OK       → within band — no flag
  HIGH     → above average, within ceiling — soft flag, note added to audit
  CRITICAL → above ceiling — hard flag, assessor must provide justification
        ↓
Flag logged to AuditIntelligenceService → visible on insurer dashboard
        ↓
Assessor can add justification note (rare parts, import premium, etc.)
        ↓
Audit report exportable per claim — full paper trail
```

### 17.7 Admin Benchmark Management

Platform operators get a dedicated admin panel section for benchmark management:

- View all parts with their current benchmark source (seeded / blended / market)
- Override any benchmark manually — with mandatory reason field (fully audited)
- Set transition thresholds (e.g. "graduate to blended mode at 50 transactions")
- Export benchmark data per market for insurer reporting
- See benchmark drift over time — detect market price movements
