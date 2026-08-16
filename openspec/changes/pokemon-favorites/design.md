# Design: Pokemon Favorites — Full Figma App (Splash, Onboarding, TabBar Shell, Type Filter, Rich Detail, Favorites, Share)

> Realigned 2026-08-15 to `figma-design-notes.md` and the 8 delta specs. Extends — not discards — the previous design: layer order (types → services → store → composables → components → views), single `usePokemonStore`, service layer with in-memory caches, favorites snapshot + localStorage, infinite scroll 24/page, debounced local search, fixed share format, pure-CSS pokeball loader all kept. Removed: Welcome screen (never existed), the "ver más" expandable (rich panel renders all fields), the direct `/`-as-entry assumption (fixed Splash→Onboarding flow). Endpoint contract expands from 2 to the 4 whitelisted by the specs: `GET /pokemon`, `GET /pokemon/{name}`, `GET /pokemon-species/{id}`, `GET /type/{tipo}`.

## Technical Approach

Greenfield Vue 3.5 (Composition API, `<script setup>`) app. One Pinia setup store owns catalog pages, filtered set + client pagination, nav context, search, and favorites; a thin typed service layer owns the four allowed PokeAPI endpoints, each with an in-memory session cache (detail by name, species by id, type catalogs by type); `storage.ts` persists favorites. URL-driven routing with a cold-load guard: on every reload the first navigation is forced through Splash → Onboarding 01/02 → shell, remembering the intended target so deep links and browser history survive. The shell is a 4-item TabBar (Pokedex / Regiones / Favoritos / Perfil) hosting the real views and the shared Construcción screen; `/pokemon/:name` renders the rich detail with the shell visible. All UI copy in Spanish; PokeAPI data stays English. Strict TDD drives every layer (`npm run test:unit -- --run`).

## Routes

| Path | View | Behavior |
|------|------|----------|
| `/splash` | `SplashView` | Pure-CSS pokeball loader (`aria-hidden`); auto-advance after **1500 ms** → `/onboarding` |
| `/onboarding` | `OnboardingView` | Steps 01/02, 2-dot paginator; `Continuar` → step 02; `Empecemos` → stored target (default `/`) |
| `/` | `PokedexListView` | Pokedex tab (default active): catalog list, search, filter control |
| `/regions` | `ConstructionView` | Regiones tab — shared Construcción screen |
| `/favorites` | `FavoritesView` | Favoritos tab — snapshot list, trash, empty state |
| `/profile` | `ConstructionView` | Perfil tab — shared Construcción screen |
| `/pokemon/:name` | `PokemonDetailView` | Rich detail; TabBar visible, Pokedex active |

**Entry-flow decision**: `/` **stays** the Pokedex list (the `navigation-tabbar` spec pins `/` = Pokedex and a reload at `/favorites` must activate Favoritos), so Splash/Onboarding live on pre-shell routes. A module-scoped `flowComplete` flag in `src/router/index.ts` starts `false` on every app load; the first `beforeEach` navigation redirects to `/splash` and stashes the intended target in a module ref; after `Empecemos` the flag flips and the router resumes to the target. In-memory only — no onboarding-seen key (the `onboarding-flow` spec forbids persistence and skip). Deep link /favorites → splash → onboarding → `/favorites`; history works after the flag flips. Onboarding steps use **buttons only** (no swipe) — the spec requires keyboard-operable CTAs and swipe adds no required behavior.

## Folder Structure & Layers

```
src/
├── types/pokemon.ts          # API contracts, TypeName/TypeMeta, WeaknessChart
├── data/types.ts             # TYPE_META (18 types: esLabel, color, icon) + WEAKNESS_CHART
├── services/
│   ├── pokeapi.ts            # 4 endpoints + 3 session caches (detail/species/type)
│   └── storage.ts            # localStorage read/write (try/catch fallback)
├── stores/pokemon.ts         # single Pinia setup store
├── composables/
│   ├── useInfiniteScroll.ts  # IO sentinel + guards
│   ├── useDebouncedRef.ts    # search debounce (300 ms)
│   └── useClipboard.ts       # clipboard + execCommand fallback + feedback
├── components/               # presentational only (props/emit)
│   ├── TabBar.vue            # 4-item shell nav (renamed from BottomNavBar)
│   ├── PokemonCard.vue       # Figma card: Nº, name, TypeBadges, type-colored bg (renamed from PokemonRowItem)
│   ├── TypeBadge.vue         # chip: icon in white circle + ES label
│   ├── TypeFilterSheet.vue   # BottomSheet dialog: 18 checkboxes, Aplicar/Cancelar
│   ├── SearchBar.vue
│   ├── EmptyState.vue        # Favorites empty (Figma copy)
│   ├── ErrorState.vue        # shared "Algo salió mal..." + Reintentar + Magikarp
│   ├── ConstructionState.vue # shared "¡Muy pronto disponible!" + Magikarp
│   ├── Magikarp.vue          # inline SVG illustration (decorative, shared)
│   ├── PokeballLoader.vue
│   ├── PokemonDetailPanel.vue# rich panel: all Figma fields at once (no "ver más")
│   ├── FavoriteButton.vue    # heart / heart-solid, aria-pressed
│   └── ShareButton.vue       # clipboard share + success/error feedback
├── views/
│   ├── SplashView.vue        # /splash
│   ├── OnboardingView.vue    # /onboarding
│   ├── PokedexListView.vue   # /
│   ├── PokemonDetailView.vue # /pokemon/:name
│   ├── FavoritesView.vue     # /favorites
│   └── ConstructionView.vue  # /regions + /profile (wraps ConstructionState)
├── router/index.ts           # routes + cold-load guard
├── styles/
│   ├── tokens.css            # palette, radius, shadow, spacing, type scale
│   └── main.css              # base layout, keyframes, transitions
└── __tests__/                # *.spec.ts (vitest + VTU)
```

Layers kept: **types** (single source of truth for API shapes) → **services** (fetch + caches, mocked wholesale in store tests) → **store** (one store, no cross-store orchestration) → **composables** (framework-agnostic logic) → **components** (no network/store imports, tested via props/emits) → **views** (composition root wiring store + composables + components).

## Store (`usePokemonStore`)

| Slice | State / API | Notes |
|-------|------------|-------|
| Catalog | `pokemonList`, `nextUrl`, `loadingFirst`, `loadingMore`, `pageError`; `loadMore()`, `retryPage(offset)` | 24/page, dedupe-by-name merge, guards (kept) |
| Type preload | `typePreloaded`, `typePreloadError`; `preloadTypes()` | Init: bounded prefetch of 18 catalogs → `nameToTypes` map; retryable, non-blocking |
| Type filter | `appliedTypes`, `filteredSet` (joined, deduped by name), `filterSliceIndex`, `filterError`; `applyTypeFilter(types)`, `clearFilter()` | `visibleFiltered = filteredSet.slice(0, (sliceIndex+1)*24)`; clear resets types + search + pagination |
| Search | `searchFilter`; `filteredList` computed | Local substring over the active base list (catalog pages or visible filtered slices) |
| Detail | `selectedDetail`, `selectedSpecies` (derived fields), `detailError`; `openDetail(name)` | Same-name guard; species fields degrade to `—` on failure, never block the panel |
| Nav context | `contextNames`, `navIndexOf(name)`, `prevName`/`nextName`; `setNavContext(names)` | Set on card activation (filtered-set order when active, else loaded catalog order); undefined at bounds; deep-linked detail → both controls disabled |
| Favorites | `favorites`, `toggleFavorite`, `isFavorite`, `removeFavorite` | Snapshot persistence + `storage`-event sync, try/catch memory fallback (kept) |
| Tabs | none — TabBar derives active item from route | Data slices are what survive tab switches |

Caches live in `pokeapi.ts`, not the store: `detailCache` (by name), `speciesCache` (by id), `typeCatalogCache` (by type) — session-lifetime, never persisted, failed/404 never cached.

## Patterns

- **Type catalog preload + `nameToTypes` map (cards)**: at store init the service prefetches the 18 `GET /type/{tipo}` catalogs (concurrency-bounded ≤6 in flight), each cached in `typeCatalogCache`, and builds `nameToTypes: Map<name, TypeName[]>` from their `pokemon[].pokemon.name` entries. Cards read types from this map — ZERO detail requests per card, no shimmer for types, and the same cached catalogs make filter application instant. Cost: 18 requests (~2–3 MB JSON) once per session; replaces the per-card detail fan-out entirely (no `useBoundedFanOut`).
- **Atomic filter union**: `applyTypeFilter` runs `Promise.all` over the already-cached type catalogs for the selected types (cache hits skip network — the preload guarantees this). Any rejection → no union, no list change, sheet stays open with inline Error + `Reintentar` re-issuing only the failed types. Success → name-dedupe union, `filteredSet` replaced, `filterSliceIndex = 0`. At most 18 type requests per session (the preload).
- **Client pagination over filter**: the sentinel increments `filterSliceIndex` while `(sliceIndex+1)*24 < filteredSet.length` — zero API calls under an active filter; catalog mode keeps `nextUrl` pagination.
- **Indexed Próximo/Anterior**: `contextNames` captured on card activation; the detail view computes the current index and pushes `/pokemon/{prev|next}`; caches make the adjacent render instant; bounds disable the control.
- **Tab state preservation**: data state lives in the store (survives regardless); `<KeepAlive>` wraps the shell `router-view` for `PokedexListView`/`FavoritesView` to preserve scroll position and DOM cheaply. No refetch on return (`loadFirstPage` guarded by `pokemonList.length === 0`).
- **Favorites** (kept): snapshot `{name, id, imageUrl, types, addedAt}` persisted under `pokemon-favorites` on every mutation; rehydrate on init; `storage`-event cross-tab sync; full-array writes, last-write-wins.
- **Share** (kept): pure `buildShareText(detail)` → `{name}, {types}, HP {hp}, Attack {attack}, Defense {defense}, Speed {speed}`; `useClipboard` primary → `execCommand` fallback → visible error; surfaced from the rich detail panel. Species-derived fields are display-only (spec: format frozen).
- **Search** (kept): debounced 300 ms, local-only, applies to the active base list.

## Animations (Task 5)

Pure CSS — no libraries; all decorative animations gated by `prefers-reduced-motion` (timing and flow unchanged).
- **Splash**: `@keyframes` pokeball spin/bounce (kept).
- **Onboarding ↔ shell**: Vue `<Transition>` fade/slide between steps and into the shell.
- **BottomSheet**: `<Transition name="sheet">` + `transform: translateY(100%) → 0`, top radius 24px + shared top shadow.
- **Loading cards**: subtle shimmer skeleton while a card's types resolve.

## Assets (Task 6)

| Asset | Decision |
|-------|----------|
| `design-reference/icons/type-*.png` (18) | Copy → `src/assets/icons/` (referenced via `TypeMeta.icon`) |
| `design-reference/icons/icon-heart.svg`, `icon-heart-solid.svg` | Copy → `src/assets/icons/` (SVG over the PNG variants) |
| Magikarp | NOT copied — inline SVG in `Magikarp.vue` (decorative `aria-hidden`, shared by Error/Construcción) |
| `design-reference/*.png` (12 screens) | Reference only — never imported or bundled |
| Pokemon artwork | PokeAPI `official-artwork` CDN URL derived from id (kept — static asset, not an endpoint) |

## Styling (Task 7)

Tokens in `src/styles/tokens.css` from `figma-design-notes.md`:
- **Palette**: `--bg #fafafa`; `--primary #1e88e5` (CTA / "Borrar filtro"); `--tab-active #0d47a1`; `--title #121212`; `--subtitle #424242`; `--danger #cd3131` (trash); onboarding dots `#173ea5`/`#4565b7`; card backgrounds per type (grass `#8bc34a`, fire `#ff9800`, psychic/poison `#9c27b0`, …).
- **Radius**: card 16px; button + chip pill 100px; BottomSheet top 24px; TabBar top 16px; chip icon circle 100px.
- **Shadow**: `--shadow-top: 0 -1px 3px rgba(0,0,0,0.12)` — shared by TabBar and BottomSheet.
- **Spacing**: 4px scale; card padding 16, info gap 4, inner gap 29; sheet padding 16/16/16/32, gap 16; TabBar 16/16/24/24, item gap 11.
- **Type scale**: screen title 26/500; detail name 32/500; card name 21/600; Nº 12/600; data label 12/500; data value 18/500; CTA 18/600; search placeholder 14/400.
- **Card layout**: horizontal — info left, image right (`space-between`, center); chip = white icon circle + ES label.

## TypeScript Contracts

`src/types/pokemon.ts` adds to the previous contracts: `TypeName` (18-value union), `TypeMeta { name: TypeName; esLabel: string; color: string; icon: string }`, `TypeCatalogResponse { damage_relations; pokemon: { slot; pokemon: PokemonSummary }[] }`, `PokemonSpecies { flavor_text_entries; genera; gender_rate }`, `WeaknessChart = Record<TypeName, TypeName[]>` (local static `double_damage_from` mirror). `src/data/types.ts` exports `TYPE_META` (18 entries) and `WEAKNESS_CHART`. Existing `PokemonSummary`, `PokemonListResponse`, `PokemonStats`, `PokemonDetail` (+ `species: { url }`), `FavoritePokemon`, `PAGE_SIZE = 24`, `STORAGE_KEY = 'pokemon-favorites'` kept; `buildShareText`/`buildFavoriteSnapshot` helpers kept.

## Data Flow

```
Views ──► Components ──► usePokemonStore ──► services/pokeapi.ts ──► PokeAPI (4 endpoints)
              ▲                │
              │                └──► services/storage.ts ──► localStorage (pokemon-favorites)
              └──────── Types + data (src/types/pokemon.ts, src/data/types.ts) — no cycles
```

Entry flow (cold load):

```
router.beforeEach (flowComplete=false)
  → redirect → /splash (pending target saved in module ref)
  → 1500 ms → /onboarding (step 01 → Continuar → step 02)
  → Empecemos → flowComplete = true → router to target (default /)
```

Filter apply (atomic):

```
Aplicar → store.applyTypeFilter([grass, poison])
  → Promise.all(fetchTypeCatalog(grass), fetchTypeCatalog(poison))  # cache hits skip
  → any reject → sheet stays open + inline Error/Reintentar (retry failed types only)
  → all ok → union deduped by name → filteredSet → slice 0 → "Se han encontrado N resultados"
```

List → detail + share + prev/next (canonical URL-driven):

```
Card tap → setNavContext(active ordered list) → router.push(`/pokemon/{name}`)
  → PokemonDetailView: route.params.name → store.openDetail(name)
  → pokeapi.fetchPokemonDetail(name) [+ fetchPokemonSpecies(id), non-blocking]
  → PokemonDetailPanel (all Figma fields; species fields degrade to "—")
  → ShareButton → buildShareText(detail) → useClipboard → success/error
  → Próximo/Anterior → navIndexOf(name) ± 1 → router.push(next/prev) (disabled at bounds)
  → back (browser history) → "/" re-renders instantly from store (KeepAlive preserves scroll)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/pokemon.ts` | Create | Contracts + `TypeName`/`TypeMeta`/`TypeCatalogResponse`/`PokemonSpecies`/`WeaknessChart` |
| `src/data/types.ts` | Create | `TYPE_META` (18) + `WEAKNESS_CHART` |
| `src/services/pokeapi.ts` | Create | `fetchPokemonPage`, `fetchPokemonDetail`, `fetchPokemonSpecies`, `fetchTypeCatalog` + 3 caches (type catalogs preloaded at init) |
| `src/services/storage.ts` | Create | Load/save favorites, try/catch fallback |
| `src/stores/pokemon.ts` | Create | Catalog, type preload (`nameToTypes`), filter, search, detail, nav context, favorites slices |
| `src/composables/useInfiniteScroll.ts` | Create | IO sentinel + guards |
| `src/composables/useDebouncedRef.ts` | Create | Search debounce |
| `src/composables/useClipboard.ts` | Create | Copy + fallback + feedback |
| `src/components/{TabBar,PokemonCard,TypeBadge,TypeFilterSheet,SearchBar,EmptyState,ErrorState,ConstructionState,Magikarp,PokeballLoader,PokemonDetailPanel,FavoriteButton,ShareButton}.vue` | Create | Presentational Figma components |
| `src/views/{SplashView,OnboardingView,PokedexListView,PokemonDetailView,FavoritesView,ConstructionView}.vue` | Create | Route views |
| `src/styles/{tokens.css,main.css}` | Create | Tokens, layout, keyframes, transitions |
| `src/__tests__/*.spec.ts` | Create | Unit + integration (strict TDD, RED first) |
| `src/router/index.ts` | Modify | Routes table + cold-load guard |
| `src/App.vue` | Modify | App shell: header + TabBar + `<router-view/>` (KeepAlive for shell tabs); demo text removed |
| `src/main.ts` | Modify | Import `@/styles/tokens.css` + `@/styles/main.css` |
| `src/__tests__/App.spec.ts` | Modify | Shell assertion; drop `You did it!` |
| `README.md` | Modify | Stack + key decisions |
| `src/stores/counter.ts` | Delete | Demo store (spec: must not exist) |

## Testing Strategy

Strict TDD: every spec scenario maps to a RED unit/integration test written before production code; `npm run test:unit -- --run`.

| Layer | Specs covered | What to Test | Approach |
|-------|--------------|--------------|----------|
| Service | pokemon-list, pokemon-detail, type-filter | 4 endpoint URLs (`limit=24&offset=N`, `/species/{id}`, `/type/{tipo}`), mappings, 3 caches (hit skips fetch, failed/404 never cached), species degradation | `vi.stubGlobal('fetch', …)` |
| Store | all 8 | Pagination idempotence/dedupe/exhaustion, retry keeps prior pages, filter union atomicity (failure → no partial set) + slice pagination, clear filter, search, nav context bounds, favorites toggle/persist/rehydrate/sync/storage-failure, `openDetail` guard | `setActivePinia(createPinia())` + `vi.mock('@/services/pokeapi')` |
| Composables | pokemon-list, share, type-filter | IO guard states, debounce timing, clipboard primary/fallback/failure, exact `buildShareText` (pikachu, bulbasaur) | Stub IO/Clipboard; fake timers |
| Store/Service | all 8 | Type preload: 18 catalogs fetched once, `nameToTypes` map built, cards read types without detail requests, filter union uses cached catalogs (no network on apply) | `vi.stubGlobal('fetch', …)` |
| Components | all 8 | TabBar 4 items + `aria-current`, PokemonCard types-after-cache, TypeFilterSheet (dialog, focus trap, Escape, Aplicar disabled without selection, Cancelar discards), Error/Construcción exact copy + Magikarp `aria-hidden`, Onboarding CTAs/dots, Splash 1500 ms auto-advance (fake timers), EmptyState copy, FavoriteButton `aria-pressed` | VTU mount + mocked store |
| Router | onboarding-flow, navigation-tabbar | Cold-load guard redirects to `/splash`, target restored after flow, deep-link `/favorites` activates Favoritos after flow, detail keeps shell/Pokedex active | Real router + pinia |
| Integration | pokemon-list, pokemon-detail, favorites | Shell renders, list → detail, route param drives `openDetail`, back returns to list, favorites → detail | VTU + real router/pinia |
| E2E (Playwright) | all 8 | Full journey: splash → onboarding → list → scroll → filter → detail → favorite → Favoritos tab → trash → share → reload persistence; deep-link `/pokemon/pikachu` | Declared; needs dev/preview server + browsers |

## UI/UX

- **Loading**: `PokeballLoader` (decorative `aria-hidden`) + card shimmer; `aria-busy` on the list during fetches; `prefers-reduced-motion` respected everywhere.
- **Empty**: `EmptyState` — exact Figma copy `No has marcado ningún Pokémon como favorito` / `Haz clic en el ícono de corazón de tus Pokémon favoritos y aparecerán aquí.`
- **Error**: shared `ErrorState` (`Algo salió mal...` / `No pudimos cargar la información...` / `Reintentar`, Magikarp, `role="alert"`) for list first-page and detail failures; inline sentinel error + Retry for later pages; inline error inside the sheet for type-catalog failures; 404 not-found with link back to the list.
- **Construcción**: shared `ConstructionState` (`¡Muy pronto disponible!` / `Estamos trabajando para traerte esta sección`, Magikarp) for Regiones/Perfil, inside the shell, zero network.
- **Layout**: mobile-first single column (max-width ~640 px), 2-column grid ≥ 640 px, sticky `TabBar` (top corners 16px + top shadow).
- **a11y**: `<nav>` landmark TabBar with `aria-current`; sheet as `role="dialog"`/`aria-modal` with focus trap and restore; `aria-pressed` on favorite controls; focus moves to the detail heading on navigation; text, not color alone, for types/tabs.

## Threat Matrix

Routing changed (new routes + cold-load guard), but the guard is an in-memory boolean with no persistence, shell, subprocess, VCS/PR, or executable-file boundary.

| Boundary | Minimum adversarial cases | Applicability | Design response | Planned RED tests |
|---|---|---|---|---|
| Documentation-like paths | `requirements.txt`, `CMakeLists.txt`, executable Markdown/MDX, `README.sh` | N/A — client-only Vue app; no executable-doc handling | — | — |
| Git repository selection | `git -C`, relative paths, absolute paths | N/A — no git invocation | — | — |
| Commit state | staged, `commit -a`, empty index | N/A — no VCS automation | — | — |
| Push state | tracking branch, first push, explicit refspec | N/A — no VCS automation | — | — |
| PR commands | explicit `--head`, environment prefix, composed commands | N/A — no PR automation | — | — |

The only dynamic input is the route param in `/pokemon/:name` — an encoded path segment in fixed-prefix fetch URLs (never executed). Cold-load guard writes no storage and spawns no process. No applicable rows; no RED tests required for this section.

## Migration / Rollout

No migration. Favorites survive reloads via the namespaced `pokemon-favorites` key; corrupt JSON is discarded (try/catch parse). Onboarding state is in-memory by design (spec: no persisted flag), so every reload re-runs the fixed flow. Rollback: revert the feature commits (chained PR slices) — client-only change, no DB.

## Open Questions

- None blocking. Non-blocking notes for tasks: type-preload concurrency constant (6) and shimmer duration are tuning details; a deep-linked detail renders with Próximo/Anterior disabled (no list context exists) — acceptable per the index-based design.
