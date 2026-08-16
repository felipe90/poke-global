# pokemon-list Specification

> Full spec (greenfield — `openspec/specs/` has no prior spec for this domain).
> Realigned 2026-08-15 to the Figma: type-colored cards with Nº/name/types, search bar, type-filtered list with infinite scroll over the joined filtered set, result count + "Borrar filtro", shared Error screen for first-page failure.

## Purpose

Loads the Pokemon catalog from `GET /api/v2/pokemon` incrementally via infinite scroll, rendered on the Pokedex tab inside the app shell, with Figma cards, local search over loaded items, and type-filtered rendering over the joined type catalogs (see `type-filter` spec). Bounded rendering and per-page loading/error states.

## Data Contracts

| Type | Shape |
|------|-------|
| `PokemonSummary` | `{ name: string; url: string }` |
| `PokemonListResponse` | `{ count: number; next: string \| null; previous: string \| null; results: PokemonSummary[] }` |
| `TypeCatalogResponse` | `{ damage_relations: { double_damage_from: { name: string }[] }; pokemon: { slot: number; pokemon: PokemonSummary }[] }` — full catalog, unpaginated (see `type-filter` spec) |
| `TypeName` | `"grass" \| "fire" \| "water" \| "electric" \| "psychic" \| "poison" \| "normal" \| "bug" \| "fighting" \| "ground" \| "rock" \| "ice" \| "fairy" \| "ghost" \| "dragon" \| "dark" \| "steel" \| "flying"` |

Allowed PokeAPI endpoints (MUST NOT call any other): `GET /api/v2/pokemon`, `GET /api/v2/pokemon/{name}`, `GET /api/v2/pokemon-species/{id}`, `GET /api/v2/type/{type}`.

## Requirements

### Requirement: Paginated incremental loading

The list MUST fetch only `GET /api/v2/pokemon` with a fixed page size of 24 (`limit=24`, `offset = pageIndex * 24`), one page per request, merged in order. When a type filter is active, pagination MUST serve slices of 24 from the joined filtered set (client-side) instead of new API pages.

#### Scenario: Initial page

- GIVEN the list route opens with no data loaded
- WHEN the view mounts
- THEN a request with `limit=24&offset=0` is issued
- AND a CSS pokeball loader (decorative, `aria-hidden`) shows until the page resolves

#### Scenario: Next page on scroll

- GIVEN page N is rendered and `next` is not null (catalog mode)
- WHEN the scroll sentinel enters the viewport
- THEN exactly one request for page N+1 is issued, with no duplicate `name` appended

#### Scenario: Next slice on scroll (filter active)

- GIVEN a type filter is applied and slice N of the joined set is rendered
- WHEN the scroll sentinel enters the viewport and more of the joined set remains
- THEN slice N+1 (next 24 items, same filters) renders with no new API page request

#### Scenario: Catalog exhausted

- GIVEN the last page is rendered (`next` is null) or the filtered set is fully sliced
- WHEN the sentinel enters the viewport
- THEN no further request or slice is issued

#### Scenario: No concurrent duplicate requests

- GIVEN a page request is in flight
- WHEN the sentinel re-enters the viewport
- THEN no second request is issued

### Requirement: Figma cards with type metadata

Each card MUST render Nº (3-digit padded id from the summary URL, e.g. `Nº001`), the name, and type chips with a type-colored background. Types MUST be resolved from `GET /api/v2/pokemon/{name}` (the shared in-memory detail cache — see `pokemon-detail` spec); a cache hit renders instantly, a miss renders Nº + name immediately and the chips/background when the detail resolves. At most one detail request per pokemon per session.

#### Scenario: Card from list response

- GIVEN a page of summaries is loaded
- WHEN a card renders
- THEN Nº and name show immediately and the type-colored background/chips appear once the (cached) detail for that pokemon resolves

#### Scenario: Card types never refetch

- GIVEN a pokemon's detail is cached (e.g. from a previous detail visit)
- WHEN its card renders
- THEN the card types render synchronously with no network request

### Requirement: Search over loaded items

The system MUST provide a search bar (placeholder `Buscar Pokémon...`) that filters the currently loaded items by name, case-insensitive substring, debounced (300 ms). Search MUST NOT issue any API call; it applies to loaded API pages, or to the loaded slices of the filtered set when a type filter is active.

#### Scenario: Search matches

- GIVEN 24 items are loaded
- WHEN the user types `pika` and the debounce elapses
- THEN only items whose name contains `pika` render and the count text shows the number of matches

#### Scenario: Search no matches

- GIVEN items are loaded
- WHEN the user types a query with no name match
- THEN the list shows zero results and the count text reads `Se han encontrado 0 resultados`

### Requirement: Filtered list state and clear

When a type filter is applied (see `type-filter` spec), the list MUST render the joined filtered set from its first slice, show `Se han encontrado {N} resultados` (N = joined set size; singular `Se ha encontrado 1 resultado`), and show a `Borrar filtro` control that clears the type selection AND the search query, restoring the catalog list and resetting pagination.

#### Scenario: Apply filter

- GIVEN two types selected (e.g. `grass`, `poison`) and Aplicar pressed in the sheet
- WHEN the sheet closes
- THEN the list renders from the joined, deduplicated set (first 24), count shows the joined size, and `Borrar filtro` is visible

#### Scenario: Clear filter and search

- GIVEN a filter and a search query are active
- WHEN `Borrar filtro` is activated
- THEN the search box is empty, type selection resets, and the unfiltered catalog list renders from page 0

### Requirement: List loading and error states

The system MUST distinguish loading, empty, and error states and keep previously loaded pages when a later page fails.

#### Scenario: First-page error with retry

- GIVEN the initial request fails (network error or 5xx)
- WHEN the error is received
- THEN the shared Error screen renders (`Algo salió mal...` + `No pudimos cargar la información...` + `Reintentar`, Magikarp — see `feedback-states` spec)
- AND `Reintentar` re-issues the first-page request

#### Scenario: Subsequent-page error

- GIVEN page N is rendered and page N+1 fails
- WHEN the error is received
- THEN page N stays visible and the sentinel area shows an error + Retry
- AND retrying re-issues only page N+1

#### Scenario: Type-catalog fetch failure

- GIVEN Aplicar triggers a type-catalog fetch that fails
- WHEN the error is received
- THEN the filter is NOT applied, no partial result set renders, and the sheet shows an inline error with retry/cancel (see `type-filter` spec)

### Requirement: Non-blocking performance

Loading MUST NOT block the UI thread or render the full catalog.

#### Scenario: Bounded rendering

- GIVEN 10 pages loaded (240 items) or a filtered set of 500 items
- WHEN the list renders
- THEN only loaded pages'/slices' items are in the DOM (no full-catalog fetch, no full-set render)

#### Scenario: Responsive during fetch

- GIVEN a page fetch or type-catalog fetch is in flight
- WHEN the user scrolls or activates a card
- THEN the view remains interactive

### Requirement: Basic accessibility

The list MUST be keyboard-operable; state MUST not rely on color alone.

#### Scenario: Keyboard and announced states

- GIVEN a rendered card
- WHEN it is focused and activated with the keyboard
- THEN it navigates to the detail route
- AND the list exposes `aria-busy` during fetches, images have `alt`, and favorite controls expose `aria-pressed`

### Requirement: App shell and demo scaffold cleanup

(Resolved decision: the demo `counter` store and its content MUST be removed — no dead demo code.) The demo store, the `App.vue` demo content, and the demo assertion in `src/__tests__/App.spec.ts` MUST be removed or replaced; `App.vue` MUST render the app shell (header + `router-view`) hosting the Pokedex tab at `/`.

#### Scenario: No demo artifacts

- GIVEN the application source
- WHEN `src/` is inspected
- THEN no `stores/counter.ts` exists and `App.vue` contains no demo text (`You did it!`)

#### Scenario: Shell renders list

- GIVEN `App.vue` is mounted
- WHEN the router resolves `/`
- THEN the app shell (header + TabBar) and the list view render

## Resolved Decisions

- **Errors**: per-page error + Retry; a failed page never clears previously loaded pages; first-page failure uses the shared Error screen.
- **Page size**: fixed at 24 (within confirmed 20–30), constant at runtime.
- **Counter store**: removed (see "App shell and demo scaffold cleanup").
- **Card types**: resolved via the detail endpoint with the shared in-memory cache (one request per pokemon per session); required for Figma card parity since the list endpoint returns only `{name, url}`. Fan-out of up to 24 detail requests per new page — cached, never repeated.
- **Search**: local only (no API call), 300 ms debounce, applies to loaded items of the active list.
- **Filter pagination**: client-side slices of 24 over the joined filtered set (type catalogs are unpaginated, e.g. electric = 114).
