# poke-global — Pokédex de Favoritos

A production-shaped **Pokémon favorites Pokédex** built as the **Global66 Front End technical
assessment** with **Vue 3**. It renders the official Figma product: a fixed Splash → Onboarding
entry flow, a 4-tab shell (Pokedex / Regiones / Favoritos / Perfil), a paginated catalog with
local search and multi-type filter, a rich detail screen, favorites persisted across reloads with
cross-tab sync, one-tap share, and designed loading / error / construction states.

> **Language note**: the UI copy is in **Spanish** (as specified by the assessment and the Figma);
> PokeAPI data (names, types, stats) stays in English.

---

## Table of Contents

- [Stack](#stack)
- [Architecture](#architecture)
- [Key Decisions](#key-decisions)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Spec-Driven Development](#spec-driven-development)
- [Known Debt](#known-debt)

---

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Vue 3.5** — Composition API (`<script setup>`) | Idiomatic, testable, close to the framework's recommended style |
| Language | **TypeScript 6** (strict) | Typed API contracts prevent PokeAPI shape drift |
| State | **Pinia 4** (single setup store) | One store owns catalog, filter, search, detail, and favorites |
| Routing | **Vue Router 5** | URL-driven list → detail; deep links, history, and a cold-load guard |
| Build | **Vite 8** | Fast dev server, standard Vue tooling |
| Unit tests | **Vitest 4** + Vue Test Utils (jsdom) | 206 tests covering services, store, composables, components, and views |
| E2E | **Playwright** | Browser-level journey (declared; requires dev/preview server + browsers) |
| Lint / format | ESLint + oxlint + Prettier | Consistent code; scripts run with `--fix` |

---

## Architecture

Strict layer separation — each layer depends only on the ones below it:

```
views ──► components ──► store ──► services ──► PokeAPI (4 whitelisted endpoints)
                ▲               │
                │               └──► storage ──► localStorage (pokemon-favorites)
                └──────── types + data (contracts & static type metadata) — no cycles
```

- **types** (`src/types/pokemon.ts`) — single source of truth for API shapes (`PokemonSummary`,
  `PokemonDetail`, `PokemonSpecies`, `TypeCatalogResponse`…), `PAGE_SIZE = 24`, `STORAGE_KEY`.
- **data** (`src/data/types.ts`) — static `TYPE_META` (18 types: ES label, color, icon) and the
  local `WEAKNESS_CHART` (mirror of PokeAPI `double_damage_from`).
- **services** (`src/services/`) — `pokeapi.ts` is the ONLY module allowed to call PokeAPI (4
  endpoints, each with an in-memory session cache; failed/404 never cached). `storage.ts` persists
  favorites with a safe in-memory fallback.
- **store** (`src/stores/pokemon.ts`) — single `usePokemonStore`: catalog pagination, type preload,
  filter union, search, nav context, detail + derived species, favorites. Tests mock the service.
- **composables** (`src/composables/`) — framework-agnostic logic: `useInfiniteScroll`
  (IntersectionObserver + guards), `useDebouncedRef` (300 ms search), `useClipboard`
  (clipboard + `execCommand` fallback + feedback).
- **components** (`src/components/`) — presentational only (props/emits, no store/network imports).
- **views** (`src/views/`) — composition root: wire store + composables + components per route.

**Routes**: `/splash` → `/onboarding` → `/` (Pokedex), plus `/regions` and `/profile` (shared
Construcción screen), `/favorites`, and `/pokemon/:name` (rich detail, shell visible).

---

## Key Decisions

1. **4 whitelisted PokeAPI endpoints, session caches.** The assessment asked for 2 calls; the
   official Figma's rich detail requires species text, so the scope was consciously expanded
   (documented in the SDD proposal) to `GET /pokemon`, `GET /pokemon/{name}`,
   `GET /pokemon-species/{id}`, `GET /type/{tipo}`. Each has an in-memory cache — a visited detail
   or type is fetched at most once per session.

2. **Type-catalog preload → `nameToTypes` map (zero network per card).** At list init the store
   prefetches the 18 type catalogs (bounded ≤6 in flight, cached), building
   `nameToTypes: Map<name, TypeName[]>`. Cards read their types from this map — **no per-card
   detail requests** — and the same cached catalogs make filter application instant.

3. **Favorites snapshot + localStorage + cross-tab sync.** Toggling favorites stores a self-contained
   snapshot `{name, id, imageUrl, types, addedAt}` under `pokemon-favorites`, so the Favorites tab
   renders with zero network. Writes are full-array with try/catch fallback; a `storage` event keeps
   multiple tabs in sync (last-write-wins).

4. **Fixed Splash → Onboarding flow, no persisted flag.** Every reload runs Splash (1.5 s, pure-CSS
   pokeball) → Onboarding 01/02. A module-scoped `flowComplete` flag in the router remembers the
   intended target in memory, so deep links (`/favorites`, `/pokemon/pikachu`) restore after the
   flow without writing any "onboarding seen" key.

5. **Exact share format.** `buildShareText` is frozen: `{name}, {types}, HP {hp}, Attack {attack},
   Defense {defense}, Speed {speed}` (e.g. `pikachu, electric, HP 35, Attack 55, Defense 40,
   Speed 90`). Species-derived fields (description/category/gender/weaknesses) are display-only and
   never change the format.

6. **Pure-CSS animations with `prefers-reduced-motion`.** Pokeball loader, card shimmer, onboarding
   fades, and the filter BottomSheet slide are all CSS `<Transition>`/`@keyframes` — no animation
   library; every decorative animation is gated by `prefers-reduced-motion` (timing unchanged).

7. **Atomic filter union.** `applyTypeFilter` resolves all selected type catalogs before touching the
   list; any failure keeps the previous filter and the sheet shows an inline error with a retry that
   re-issues only the failed types.

---

## Getting Started

```sh
npm install
npm run dev
```

Open http://localhost:5173 — the app starts at Splash and moves through Onboarding into the Pokédex.

## Scripts

```sh
npm run dev                # Vite dev server
npm run test:unit -- --run # Vitest unit suite (206 tests, jsdom)
npm run type-check         # vue-tsc --build
npm run lint               # oxlint + eslint (both run with --fix)
npm run build              # type-check + production build
npm run test:e2e           # Playwright (starts dev/preview server; requires browsers)
```

> **E2E note**: `npm run test:e2e` boots a local server and needs Playwright browsers installed
> (`npx playwright install`). Unit + type-check + lint are the hermetic gates that always run.

---

## Project Structure

```
src/
├── types/pokemon.ts          # API contracts, TypeName/TypeMeta, WeaknessChart
├── data/types.ts             # TYPE_META (18 types) + WEAKNESS_CHART
├── services/
│   ├── pokeapi.ts            # 4 whitelisted endpoints + 3 session caches
│   └── storage.ts            # favorites persistence (try/catch fallback)
├── stores/pokemon.ts         # single usePokemonStore (catalog/filter/search/detail/favorites)
├── composables/              # useInfiniteScroll · useDebouncedRef · useClipboard
├── components/               # TabBar, PokemonCard, TypeBadge, TypeFilterSheet, SearchBar,
│                             # EmptyState, ErrorState, ConstructionState, Magikarp,
│                             # PokeballLoader, PokemonDetailPanel, FavoriteButton, ShareButton
├── views/                    # Splash, Onboarding, PokedexList, PokemonDetail, Favorites, Construction
├── router/index.ts           # routes + cold-load guard
├── styles/                   # tokens.css (Figma palette/type scale) + main.css (layout/animations)
└── __tests__/                # *.spec.ts (Vitest + Vue Test Utils)
```

---

## Spec-Driven Development

This project was built with **Spec-Driven Development (SDD)** using the **Gentle-AI** harness, giving
the change end-to-end traceability from intent to verification:

- `openspec/changes/pokemon-favorites/` — the full SDD change:
  `proposal.md` (intent + success criteria), `figma-design-notes.md` (visual source of truth),
  `design.md` (architecture), `tasks.md` (40 tasks across 7 phases, all marked), and 8 delta specs
  (`pokemon-list`, `pokemon-detail`, `favorites`, `share`, `onboarding-flow`, `navigation-tabbar`,
  `type-filter`, `feedback-states`).
- `CHANGELOG.md` — a daily work diary documenting each decision, fix, and PR slice with rationale
  (delivery evidence for the assessment).
- Every feature was developed RED → GREEN against `npm run test:unit -- --run`; the suite (206
  tests) maps directly to spec scenarios.

**AI-First note**: the implementation was produced through the Gentle-AI SDD harness — planning,
spec/design/tasks authored as artifacts, code applied in chained, independently revertible PR slices
(PR 1 Foundation → PR 6 demo cleanup + README + final gates), each verified before the next.

---

## Known Debt

- **Fine visual tuning pending evaluator validation**: token-level geometry (colors, radii, shadows,
  spacing, type scale) matches the Figma and was measured against the Figma API, but final visual
  sign-off on composition details (e.g. exact header proportions) is pending human review.
- **Type preload cost**: 18 type-catalog requests (~2–3 MB JSON) happen once per session at list
  init; acceptable for a demo, worth revisiting if this ever faced a real backend budget.
- **Weakness chart is a static local mirror** of PokeAPI `double_damage_from` — if the upstream chart
  changes, `src/data/types.ts` must be updated.
