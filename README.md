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

- [Navigation Map](#navigation-map)
- [Stack](#stack)
- [Architecture](#architecture)
- [Layout](#layout)
- [Key Decisions](#key-decisions)
- [Edge Cases](#edge-cases)
- [Testing & CI](#testing--ci)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Spec-Driven Development](#spec-driven-development)
- [Known Debt](#known-debt)

---

## Navigation Map

The app is a mobile-first flow with a fixed entry and a 4-tab shell. Every reload starts at
Splash; there is no persisted "onboarding seen" flag, so deep links restore their target after
the flow (the router stashes the intended route in memory).

```
                         ┌──────────────────────────────┐
                         │  /splash   (1.5s pokeball)   │
                         └──────────────┬───────────────┘
                                        ▼
                         ┌──────────────────────────────┐
                         │  /onboarding  (2 steps)      │
                         │  Continuar → Empecemos       │
                         └──────────────┬───────────────┘
                                        ▼  (completeOnboarding)
   ┌───────────────────────────────────────────────────────────────┐
   │                    4-tab shell (TabBar)                       │
   │                                                               │
   │  /  Pokedex  ──►  SearchBar + filter sheet + infinite list    │
   │      │                                                         │
   │      └──►  /pokemon/:name  (rich detail, back keeps shell)    │
   │                                                               │
   │  /regions    ──►  Construcción screen                         │
   │  /favorites  ──►  Favorites list (header + trash)             │
   │  /profile    ──►  Construcción screen                         │
   └───────────────────────────────────────────────────────────────┘
```

| Route | View | Notes |
|---|---|---|
| `/splash` | `SplashView` | Public (no TabBar). Pokeball 1.5 s → `/onboarding`. Also preloads the first catalog page + type catalogs behind the loader. |
| `/onboarding` | `OnboardingView` | Public. Two steps with a CSS crossfade (both stay mounted, images preloaded). `Empecemos` flips `flowComplete` and resumes the stashed target (default `/`). |
| `/` | `PokedexListView` | Search (debounced, local), type filter BottomSheet, infinite scroll (24/page), sticky search toolbar, first-page error screen. |
| `/pokemon/:name` | `PokemonDetailView` | Rich detail panel; Próximo/Anterior within the nav context; 404 → not-found; shell visible. |
| `/regions` | `ConstructionView` | Shared Construcción screen. |
| `/favorites` | `FavoritesView` | Header (back + centered title), cards reusing `PokemonCard`, per-item trash; empty state. |
| `/profile` | `ConstructionView` | Shared Construcción screen. |

**Deep links**: `/favorites`, `/pokemon/pikachu`, etc. are stashed by the guard, so after
Splash → Onboarding the app resumes exactly there.

---

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Vue 3.5** — Composition API (`<script setup>`) | Idiomatic, testable, close to the framework's recommended style |
| Language | **TypeScript 6** (strict) | Typed API contracts prevent PokeAPI shape drift |
| State | **Pinia 4** (single setup store) | One store owns catalog, filter, search, detail, and favorites |
| Routing | **Vue Router 5** | URL-driven list → detail; deep links, history, and a cold-load guard |
| Build | **Vite 8** | Fast dev server, standard Vue tooling |
| Unit tests | **Vitest 4** + Vue Test Utils (jsdom) | **243 tests** covering services, store, composables, components, and views |
| E2E | **Playwright** (chromium) | **10 specs** covering the 5 functional paths, **deterministic** (PokeAPI fully intercepted) |
| CI | **GitHub Actions** | Two jobs: `quality` (type-check + lint + unit) and `e2e` (build + Playwright chromium) |
| Lint / format | ESLint + oxlint + Prettier | Consistent code; scripts run with `--fix` |
| Fonts | `@fontsource/poppins` + `@fontsource/montserrat` | Self-hosted Figma fonts (400–700), no CDN |

---

## Architecture

Strict layer separation — each layer depends only on the ones below it:

```
views ──► components ──► store ──► services ──► PokeAPI (5 whitelisted endpoints)
                ▲               │
                │               └──► storage ──► localStorage (pokemon-favorites)
                └──────── types + data (contracts & static type metadata) — no cycles
```

- **types** (`src/types/pokemon.ts`) — single source of truth for API shapes (`PokemonSummary`,
  `PokemonDetail`, `PokemonSpecies`, `TypeCatalogResponse`…), `PAGE_SIZE = 24`, `STORAGE_KEY`.
- **data** (`src/data/types.ts`) — static `TYPE_META` (18 types: ES label, color, icon, decorative
  element asset), `FALLBACK_TYPE_COLOR`, and pure helpers (`lightenColor`/`darkenColor`,
  `resolveEsLabel`, `resolveWeaknesses`). **Weaknesses are derived at runtime from the type
  catalogs** — there is no static weakness chart anymore.
- **services** (`src/services/`) — `pokeapi.ts` is the ONLY module allowed to call PokeAPI (5
  endpoints, each with an in-memory session cache; failed/404 never cached). `storage.ts` persists
  favorites with a safe in-memory fallback.
- **store** (`src/stores/pokemon.ts`) — single `usePokemonStore`: catalog pagination, type preload,
  filter union, search, nav context, detail + derived species, favorites, public `typeCatalog`
  lookup. Tests mock the service.
- **composables** (`src/composables/`) — framework-agnostic logic: `useInfiniteScroll`
  (IntersectionObserver with a configurable scroll `root`, resolved at observe time),
  `useDebouncedRef` (300 ms search), `useClipboard` (clipboard + `execCommand` fallback + feedback).
- **components** (`src/components/`) — presentational only (props/emits, no store/network imports).
  Reusable pieces: `AppButton`, `CustomCheckbox`, `FeedbackState` (shared error/empty/construction),
  `LoadingSpinner`, `TypeBadge`, `PokemonCard`, `SearchBar`, `TypeFilterSheet`, `TabBar`.
- **views** (`src/views/`) — composition root: wire store + composables + components per route.

---

## Layout

The app renders as a **fixed-height mobile frame** (fluid width up to 480px) with an internal
scroll container — the standard app-shell pattern:

```
┌──────────────────────────────┐  #app  (100vh, overflow hidden, max-width 480px)
│ ┌──────────────────────────┐ │
│ │ .app-main (overflow-y)   │ │  ← the ONLY scrolling region
│ │   header / toolbar       │ │     (sticky inside the scrollport)
│ │   content                │ │
│ └──────────────────────────┘ │
│ TabBar (fixed by layout)     │  ← never scrolls, touch-safe
└──────────────────────────────┘
```

- **Frame**: `#app` is `width: 100%; max-width: 480px; height: 100vh; overflow: hidden`, centered
  on desktop with a neutral body behind. The Figma design is a single 360px mobile frame, so the
  layout stays 1-column; the fluid width only avoids side gutters on real phones (>360px).
- **App-shell**: `.app-main` has `overflow-y: auto` — the scroll lives inside it, not the window.
  Headers/toolbars are `position: sticky; top: 0` inside that scrollport; the TabBar sits outside
  it, fixed by the flex column layout. This is touch-safe (body-level sticky breaks under touch
  scroll in Chrome's device toolbar).
- **Design tokens** (`src/styles/tokens.css`): Figma palette (`--surface-default`, `--primary`,
  `--title`, per-type colors…), radius scale, spacing scale (`--space-2xs…2xl`), type scale
  (Poppins/Montserrat, sizes/weights/line-heights), state colors, button/check/border tokens.
- **Measured against the Figma API**: typography, card geometry, the filter sheet, the TabBar, and
  the type icons/elements were extracted from the live Figma file and matched pixel-for-pixel.

---

## Key Decisions

1. **5 whitelisted PokeAPI endpoints, session caches.** The assessment asked for 2 calls; the
   official Figma's rich detail requires species text, so the scope was consciously expanded
   (documented in the SDD proposal) to `GET /pokemon`, `GET /pokemon/{name}`,
   `GET /pokemon-species/{id}`, `GET /type/{tipo}`, and `GET /ability/{id}` (localized ES ability
   names). Each has an in-memory cache — a visited detail, type, or ability is fetched at most
   once per session.

2. **Type-catalog preload → `nameToTypes` map (zero network per card).** At list init the store
   prefetches the 18 type catalogs (bounded ≤6 in flight, cached), building
   `nameToTypes: Map<name, TypeName[]>`. Cards read their types from this map — **no per-card
   detail requests** — and the same cached catalogs make filter application instant.

3. **Weaknesses come from the API, not a static chart.** The old static `WEAKNESS_CHART` was
   removed; `resolveWeaknesses` derives `double_damage_from` from the preloaded type catalogs, and
   `resolveEsLabel` prefers the API's `names[es]` with the Figma label as fallback. Unmapped types
   render with `FALLBACK_TYPE_COLOR` (`#9e9e9e`) and never appear in the filter (which only lists
   the 18 Figma types).

4. **Favorites snapshot + localStorage + cross-tab sync.** Toggling favorites stores a self-contained
   snapshot `{name, id, imageUrl, types, addedAt}` under `pokemon-favorites`, so the Favorites tab
   renders with zero network. Writes are full-array with try/catch fallback; a `storage` event keeps
   multiple tabs in sync (last-write-wins). The favorites list reuses `PokemonCard` (heart disabled —
   removal is only via the trash).

5. **Fixed Splash → Onboarding flow, no persisted flag.** Every reload runs Splash (1.5 s, pure-CSS
   pokeball with a preload of the first page + types) → Onboarding 01/02. A module-scoped
   `flowComplete` flag in the router remembers the intended target in memory, so deep links restore
   after the flow without writing any "onboarding seen" key.

6. **Exact share format.** `buildShareText` is frozen: `{name}, {types}, HP {hp}, Attack {attack},
   Defense {defense}, Speed {speed}`. Species-derived fields (description/category/gender/weaknesses)
   are display-only and never change the format.

7. **Pure-CSS animations with `prefers-reduced-motion`.** Pokeball loader, card shimmer, onboarding
   crossfade, and the filter BottomSheet slide are all CSS `@keyframes`/transitions — no animation
   library; every decorative animation is gated by `prefers-reduced-motion`.

8. **Atomic filter union.** `applyTypeFilter` resolves all selected type catalogs before touching the
   list; any failure keeps the previous filter and the sheet shows an inline error with a retry that
   re-issues only the failed types.

9. **App-shell scrolling (touch-safe).** The scroll container is `.app-main`, not the window; the
   TabBar is fixed by layout. This keeps header/toolbars pinned under touch scroll, where
   body-level `position: sticky` is unreliable. The infinite-scroll observer uses `.app-main` as its
   intersection root with a 200px `rootMargin` to preload before the sentinel reaches the edge.

---

## Edge Cases

Edge cases and hardening work lived on the `dev/edge-cases` branch (main stays the v1.0 baseline).
Each one shipped with a unit test, and most were verified in the browser with real API data.

| # | Edge case | Problem it solves | Solution |
|---|-----------|-------------------|----------|
| 1 | **Full-name search index** | Searching a pokémon not yet loaded in the list (e.g. `mew`) returned 0 results | The Splash preloads the **complete name index** (`GET /pokemon?limit=99999`, not a hardcoded 1351) once; the search matches against it whenever a query is active, while the empty-query path keeps the paginated list untouched |
| 2 | **Mega / alternate forms** | `mega-y` (id 10044) has no `pokemon-species/{id}` → 404 on the detail screen | `speciesIdFromDetail` derives the species id from `detail.species.url`, so forms resolve to their base species (e.g. Tyranitar-mega → species 1021) and the detail renders normally |
| 3 | **Localized ability** | PokeAPI's `detail.abilities[].ability.name` is English only | A 5th whitelisted call `GET /ability/{id}` resolves the ES name (fallback to EN); hydration is race-safe: switching forms re-applies the ability for the new species |
| 4 | **Static favorite image** | Favoriting from the detail stored the animated GIF (heavy, and it animates in the favorites list) | The favorite snapshot stores the **static** sprite (`front_default` → `official-artwork`) while the detail itself keeps the GIF |
| 5 | **Sticky favorites header** | The favorites header scrolled away behind the cards (z-index, not just layout) | `flex: 1 0 auto` on the scroll container + `--layer-header: 3` stacking token above the cards' `--layer-sticky: 2` |
| 6 | **Horizontal scroll in detail** | The full-bleed decorative background circle (498px) overflowed the 360px frame | `overflow: hidden` on `.detail-header` clips the circle without changing the visual |
| 7 | **Full-bleed header geometry** | The background circle must ignore the card's horizontal padding and touch the app edge | `margin-inline: calc(-1 * var(--space-card))` + `width: calc(100% + 2 * var(--space-card))` |
| 8 | **Loader → detail ease-in** | The switch from the pokeball loader to the panel was abrupt (and got slower once ability calls were added) | `<Transition mode="out-in">` with a `detail-fade` keyframe, single-root panel |
| 9 | **Symmetry of header controls** | The favorite heart sat closer to the edge than the back chevron | `margin-right: 7.5px` on `.detail-header__favorite` matches the chevron's offset exactly |
| 10 | **Bottom-sheet actions panel** | The Apply buttons panel needed a top shadow, full width, and room below the separator | `box-shadow: var(--shadow-top)` + full-width panel (`margin-inline: -16px`) with top padding; `Separator.vue` at the top and bottom of the filter list |
| 11 | **App width 360px** | The app frame was 480px but the Figma design is a 360px mobile frame; the sheet stayed fixed-width after the responsive change | `#app` max-width 360px; sheet/overlay follow (`width: 100%` + centered `max-width: 360px`) |
| 12 | **ES→EN identifier refactor** | Some derived fields used Spanish identifiers (`peso`, `altura`, `categoria`…) — inconsistent with a senior-level codebase | Renamed to English (`weight`, `height`, `category`…) across the store/panel/tests; **UI copy stays Spanish** by design |
| 13 | **Deterministic e2e** | E2E tests that hit the real PokeAPI are flaky and slow | All 10 specs intercept `**/api/v2/**` with local fixtures (deterministic, fast, offline); chromium-only |
| 14 | **CI on GitHub Actions** | No automated gates on push/PR | `.github/workflows/ci.yml`: `quality` (type-check+lint+unit) + `e2e` (build + Playwright), report artifact on failure |
| 15 | **CI determinism for placeholder views** | `views.spec.ts` asserted "zero network" but the Splash preloads the search index (real fetch) — failed on the runner | `fetchAllPokemon` mocked in `views.spec.ts` (`mockResolvedValue([])`); the placeholder views stay network-free by themselves |

---

## Testing & CI

- **243 unit tests** (Vitest + Vue Test Utils, jsdom) across services, store, composables,
  components, views, router, storage, and data helpers — hermetic, no network.
- **10 e2e specs** (Playwright, chromium) covering the 5 functional paths: onboarding (happy +
  API-error fallback), type filter, favorites (empty + swipe-to-delete), detail (all key elements),
  and placeholder sections.
- **CI (GitHub Actions)** runs both gates on every push to `main` / `dev/**` and on every PR:
  `quality` (type-check, lint, unit) then `e2e` (build + Playwright chromium, report uploaded on
  failure).
- **Gates to run locally**: `npm run type-check`, `npm run lint`, `npm run test:unit -- --run`,
  `npm run test:e2e`, `npm run build` — all green.

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
npm run test:unit -- --run # Vitest unit suite (243 tests, jsdom)
npm run type-check         # vue-tsc --build
npm run lint               # oxlint + eslint (both run with --fix)
npm run build              # type-check + production build
npm run test:e2e           # Playwright (10 chromium specs; starts dev/preview server)
```

> **E2E note**: `npm run test:e2e` boots a local server and needs the Playwright chromium browser
> installed (`npx playwright install chromium`). The specs are **deterministic**: they intercept all
> of PokeAPI (`page.route('**/api/v2/**')`) with local fixtures, so they never depend on the real
> network. Unit + type-check + lint are the hermetic gates that always run.
>
> **CI**: `.github/workflows/ci.yml` runs both gates on every push to `main`/`dev/**` and on every PR
> — `quality` (type-check, lint, unit) and `e2e` (build + Playwright chromium, report uploaded on
> failure).

---

## Project Structure

```
src/
├── types/pokemon.ts          # API contracts, TypeName/TypeMeta (incl. element), TypeCatalogResponse
├── data/types.ts             # TYPE_META (18 types) + color/element helpers + resolve* helpers
├── services/
│   ├── pokeapi.ts            # 5 whitelisted endpoints + session caches
│   └── storage.ts            # favorites persistence (try/catch fallback)
├── stores/pokemon.ts         # single usePokemonStore (catalog/filter/search/detail/favorites)
├── composables/              # useInfiniteScroll (root-aware) · useDebouncedRef · useClipboard
├── components/               # AppButton, CustomCheckbox, FeedbackState, LoadingSpinner, TabBar,
│                             # PokemonCard, TypeBadge, TypeFilterSheet, SearchBar, PokemonDetailPanel,
│                             # FavoriteButton, ShareButton, PokeballLoader
├── views/                    # Splash, Onboarding, PokedexList, PokemonDetail, Favorites, Construction
├── router/index.ts           # routes + cold-load guard (flowComplete/pendingTarget)
├── styles/                   # tokens.css (Figma tokens) + main.css (app-shell layout/animations)
├── assets/
│   ├── icons/tab + heart     # UI icons (tab bar, chevron, close, hearts)
│   ├── types/badges          # 18 type chip PNGs (also used as card-element mask shapes)
│   └── screens               # onboarding illustrations, magikarp states, loader
└── __tests__/                # *.spec.ts (Vitest + Vue Test Utils)
```

---

## Spec-Driven Development

This project was built with **Spec-Driven Development (SDD)** using the **Gentle-AI** harness,
giving the change end-to-end traceability from intent to verification:

- `openspec/` (local, not versioned) — the full SDD change: `proposal.md`, `figma-design-notes.md`
  (visual source of truth), `design.md`, `tasks.md` (40 tasks across 7 phases), and 8 delta specs
  (`pokemon-list`, `pokemon-detail`, `favorites`, `share`, `onboarding-flow`, `navigation-tabbar`,
  `type-filter`, `feedback-states`).
- `CHANGELOG.md` — a daily work diary documenting each decision, fix, and PR slice with rationale
  (delivery evidence for the assessment).
- Every feature was developed RED → GREEN against `npm run test:unit -- --run`; the suite (243
  tests) maps directly to spec scenarios.

**AI-First note**: the implementation was produced through the Gentle-AI SDD harness — planning,
spec/design/tasks authored as artifacts, code applied in chained, independently revertible PR slices
(PR 1 Foundation → PR 6 demo cleanup + README + final gates), each verified before the next.

---

## Known Debt

- **Visual polish is measured, not pixel-signed by a human**: token-level geometry (colors, radii,
  shadows, spacing, type scale) was matched against the live Figma API and measured in the browser,
  but a human final visual sign-off on every composition is still the last mile.
- **Type preload cost**: 18 type-catalog requests (~2–3 MB JSON) happen once per session at init;
  acceptable for a demo, worth revisiting if this ever faced a real backend budget.
- **Weaknesses depend on the preload**: the detail panel derives `double_damage_from` from the
  cached type catalogs; if the preload never ran or failed, weaknesses degrade to empty rather than
  a static fallback.
- **`vitest.config.ts` imports `./vite.config` without an extension** — a future Vite major may
  warn/error on this; trivial to fix.

---

## Notes for the Evaluator

A few pointers to make reviewing the delivery fast and fair:

- **Entry point**: the app starts at Splash → Onboarding → Pokédex. Everything is reproducible
  with `npm install && npm run dev` (or `npm run preview` after `npm run build`).
- **Fidelity to the Figma**: geometry, typography, spacing, and type colors were extracted from the
  live Figma API and matched at token level (see `figma-design-notes.md`); the detail screen (GIF
  artwork, gender bar, property boxes, weaknesses, full-bleed decorative background) and the filter
  BottomSheet are the most Figma-heavy screens.
- **Verification story**:
  - `243 unit tests` — hermetic, deterministic, no network; the always-green gates.
  - `10 e2e specs` — real browser, chromium-only, **deterministic** (PokeAPI fully intercepted);
    run with `npm run test:e2e`.
  - `GitHub Actions` CI — `quality` + `e2e` jobs green on push/PR.
- **Branches**: `main` is the v1.0 baseline (the full Figma product); `dev/edge-cases` carries the
  hardening (search index, mega forms, ability ES, favorites image, detail scroll/full-bleed,
  sheet/app width, ES→EN identifiers) plus the e2e suite and CI.
- **Traceability**: `CHANGELOG.md` is a day-by-day diary with rationale and affected files for every
  change; the SDD artifacts (`openspec/`, kept local) tie intent → spec → design → tasks → tests.
- **What was deliberately NOT done**: no "onboarding seen" persistence (per Figma spec), no static
  weakness chart (derived live from the API), no animation library (pure CSS + reduced-motion), and
  no per-card network calls in the list (type map preload).
