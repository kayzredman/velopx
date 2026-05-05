# VelopX — Copilot Workspace Instructions

> These instructions are always active. They define the development workflow, agent roles, and quality gates for the VelopX platform.

## Session Resume — Read These First on Every New Session
1. `/memories/repo/velopx-system-state.md` — what's built, all routes, all screens
2. `/memories/repo/velopx-build-status.md` — Sprint history + next Sprint priority order
3. `/memories/repo/velopx-workflow.md` — workflow rules, QA gate, last commit, tech facts

---

## Project Overview

**VelopX** is an auto parts intelligence platform for Sub-Saharan Africa. It connects parts dealers, garages, dispatchers, insurance assessors, and insurers on a single platform.

- **Brand**: VelopX — "velocity meets intelligence"
- **Reference docs** (always read before making decisions):
  - `velopx-product-architecture.md` — full product spec, feature modules, tech stack
  - `spare-parts-hub.md` — product design and RFP context

### Repository Structure

```
velopx/
├── backend/          # Node.js/TypeScript API (Express, Prisma, Kafka)
├── mobile/
│   ├── apps/
│   │   ├── dealer/   # Expo SDK 54, React Native 0.81.5 — parts dealer storefront
│   │   ├── driver/   # Expo SDK 54 — dispatcher/driver delivery app
│   │   └── garage/   # Expo SDK 54 — garage/mechanic shop app
│   └── packages/shared/  # Shared components, hooks, constants
└── web/              # Next.js — web dashboard
```

### Tech Stack

- **Mobile**: Expo SDK 54, React Native 0.81.5, Expo Router, Clerk auth, TypeScript
- **Web**: Next.js, Tailwind CSS, Clerk auth, TypeScript
- **Backend**: Node.js, TypeScript, Express, Prisma (PostgreSQL), Kafka, Clerk webhooks
- **Monorepo**: pnpm workspaces, pnpm@9.12.0
- **iOS Simulator**: iPhone 17, UUID `77951E55-C7B0-43E9-A699-561BF99DB787`

---

## Three-Agent Workflow

All development work is coordinated across three explicit roles. Before starting any task, declare which role is active.

### Declaring a Role

Always open a task block with:

```
[FRONTEND AGENT] — <task description>
[BACKEND AGENT]  — <task description>
[QA AGENT]       — <task description>
```

---

### Role: Frontend Agent

**Owns**: `mobile/`, `web/`, `mobile/packages/shared/`

**Responsibilities**:

- React Native screens (Expo Router), navigation, UI components
- Next.js pages and layouts
- Shared package components, hooks, constants
- Native iOS/Android build pipeline (prebuild, xcodebuild, Metro)
- Auth flows (Clerk), linking, deep links

**Standards**:

- Use `expo-router` file-based routing — no manual `Stack.Navigator` definitions
- All auth screens must use `@clerk/clerk-expo` hooks (`useSignIn`, `useSignUp`, `useOAuth`)
- Shared components live in `mobile/packages/shared/src/`
- Explicit Clerk error handling pattern (check `errors` array, not `instanceof Error`)
- Metro port 8081 for all apps — only one app Metro at a time
- All three apps (dealer, driver, garage) need identical shim setup for RN 0.81.5

**Output format**: Working screen confirmed via simulator screenshot or console confirmation

---

### Role: Backend Agent

**Owns**: `backend/src/`, `prisma/schema.prisma`, `docker-compose.yml`

**Responsibilities**:

- Express API routes under `backend/src/routes/v1/`
- Prisma schema changes and migrations
- Kafka producers and consumers
- Auth middleware (Clerk JWT verification)
- Audit capture middleware
- Webhook handlers

**Standards**:

- All routes versioned under `/v1/`
- Every mutation emits a Kafka event for audit trail
- Auth via `clerkAuth` middleware — never bypass
- Input validation at route level before touching DB
- Prisma migrations — never edit schema without generating a migration
- Error responses use `errorHandler` middleware — never raw `res.status(500).send()`

**Output format**: Tested endpoint with response shape documented

---

### Role: QA Agent

**Owns**: Nothing directly — reads and validates everything

**Responsibilities**:

- Verify completed work against `velopx-product-architecture.md` spec
- Check design consistency across all three mobile apps
- Confirm builds run without errors in simulator
- Validate API contracts match what mobile/web clients expect
- Flag any spec deviations, missing features, or regressions

**QA Checklist** (run after every completed task):

1. Does the implementation match the spec in `velopx-product-architecture.md`?
2. Are all three mobile apps consistent where they share features (auth, error handling)?
3. Does the UI match the intent in `velopx-mockups.html`?
4. Are there any TypeScript errors (`get_errors`)?
5. Do backend route shapes match what the frontend `useApi` hook expects?
6. Are audit trail events being emitted for all mutations?
7. **Route conflict check**: For every new screen file, verify no duplicate route exists elsewhere in the same app's `app/` tree (e.g., `app/foo/[id].tsx` vs `app/(group)/foo/[id].tsx` both resolve to `/foo/[id]`). Use `file_search` to confirm uniqueness.

**Output format**: Explicit PASS / FAIL checklist. Blockers listed with file + line reference.

---

## QA Gate Protocol

**Nothing ships until QA clears it.** This is enforced as follows:

1. Frontend Agent or Backend Agent completes a task and declares: `[TASK COMPLETE — awaiting QA]`
2. QA Agent runs its checklist on the completed work
3. QA outputs: `[QA PASS]` or `[QA FAIL — blockers: ...]`
4. If `[QA FAIL]`: the responsible agent fixes the blockers. QA re-reviews.
5. Only after `[QA PASS]`: work is committed and pushed

### Commit Convention (post-QA pass only)

```
feat(scope): description
fix(scope): description
refactor(scope): description
```

Scope examples: `dealer`, `garage`, `driver`, `backend`, `shared`, `web`

---

## Self-Assignment Protocol

I self-assign tasks in this order of priority:

1. **Blockers** — anything preventing a working build (e.g., garage "App entry not found")
2. **Core feature gaps** — spec features not yet implemented
3. **Polish** — UX improvements, error states, loading states

Current backlog (in priority order):

1. [BLOCKER] Garage app "App entry not found" — root cause unknown
2. [PENDING COMMIT] All driver/garage shims, expo-crypto, Clerk error handling, dealer catalogue/orders cleanup
3. [FEATURE] Dealer catalogue: parts listing, create/edit/delete
4. [FEATURE] Dealer orders: order management flow
5. [FEATURE] Garage: parts search, RFQ flow
6. [FEATURE] Driver: delivery job acceptance, status updates
7. [FEATURE] Backend: parts, orders, quotes API routes (partially scaffolded)

---

## Known Technical Context

### RN 0.81.5 Shim Setup (all three apps)

Each app has three shims in `shims/` directory, referenced in `metro.config.js`:

- `shims/getDevServer.js` — fixes `getDevServer is not a function`
- `shims/WebSocket.js` — fixes `WebSocket constructor not callable`
- `shims/setUpFuseboxReactDevToolsDispatcher.js` — guards `Object.defineProperty` for Fusebox

### Clerk Error Handling Pattern

```tsx
let message = "Sign in failed. Please try again.";
if (err && typeof err === "object" && "errors" in err) {
  const clerkErr = err as { errors: Array<{ message?: string }> };
  message = clerkErr.errors?.[0]?.message ?? message;
} else if (
  err instanceof Error &&
  err.message &&
  !err.message.includes("toString")
) {
  message = err.message;
}
setError(message);
```

### App Identifiers

| App    | Bundle ID         | Scheme        |
| ------ | ----------------- | ------------- |
| Dealer | com.velopx.dealer | velopx-dealer |
| Driver | com.velopx.driver | velopx-driver |
| Garage | com.velopx.garage | velopx-garage |
