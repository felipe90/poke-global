# Proposal: Pokemon Favorites List (Global66 Front End Assessment)

> **Realigned 2026-08-15** — `openspec/changes/pokemon-favorites/figma-design-notes.md` is now the visual source of truth. Scope expands from list/detail/favorites/share to the FULL Figma: Splash, Onboarding 01/02, 4-item TabBar, type filter (BottomSheet), rich detail, favorites with trash, Error/Construcción states. Updated sections: Intent, Scope, Product Goals, Decisions, Initial Requirements, Capabilities, Approach, Affected Areas, Risks, Success Criteria. Prior decisions (infinite scroll, Pinia+localStorage favorites, fixed share format) are kept where they don't contradict the Figma.

## Intent

The technical assessment requires a Vue app listing Pokémon with a favorites feature, consuming `https://pokeapi.co/` with exactly two calls: paginated list (`GET /api/v2/pokemon`) and per-pokemon detail (`GET /api/v2/pokemon/{name}`). The OFFICIAL Figma design (new source of truth) defines a full product beyond the assessment's minimum: Splash + 2-step Onboarding, a 4-tab shell (Pokedex/Regiones/Favoritos/Perfil), type filter, rich detail, favorites with trash, and Error/Construcción states. UI copy in **Spanish** (Figma is in Portuguese); PokeAPI data stays in English. Greenfield Vite scaffold; the catalog spans 1351+ Pokémon, so the list MUST paginate (infinite scroll), never loading everything at once.

## Scope

### In Scope
- **Entry flow**: Splash (pure-CSS pokeball loader) → Onboarding 01/02 (copy, 2-dot paginator, CTA "Continuar"/"Empecemos"). Visual-only — no real registration (backend not requested).
- **TabBar (4 items)**: Pokedex, Regiones, Favoritos, Perfil; active/inactive per Figma palette; Regiones/Perfil render the shared "Construcción" screen.
- **Pokedex list**: infinite scroll, 24/page; Figma cards (Nº001, name, type chips, type-colored background); search bar (local filter, placeholder "Buscar Pokémon..."); results state "Se han encontrado N resultados" + "Borrar filtro".
- **Type filter**: BottomSheet with the 18 types + Aplicar/Cancelar (exclusive vs multiple — open, see Risks).
- **Rich detail** at `/pokemon/:name`: Nº, name, description, Peso, Altura, Categoría, Habilidad, Género, Debilidades chips, Próximo/Anterior navigation. (Data source for description/categoría/género/debilidades — open, see Risks.)
- **Favorites**: Pinia store + localStorage (kept); toggle from list and detail; Favorites tab with trash removal + empty state (Figma copy).
- **Share** (kept, fixed format), surfaced from the rich detail panel.
- **States**: full Error screen ("Algo salió mal..." + "Reintentar", Magikarp) and Construcción ("¡Muy pronto disponible!", Magikarp).
- **UI in Spanish**; unit tests (Vitest + Vue Test Utils); README with stack and decisions.

### Out of Scope
- Backend, database, persistence beyond localStorage (explicit assessment constraint).
- Real auth/registration/multi-user/account sync — Onboarding 02 mentions "Regístrate y guarda tu perfil" but is **visual-only**; no backend requested.
- Regiones/Perfil real content — Construcción placeholders only.
- Server-side search — local filter only (no extra PokeAPI calls).
- Virtualization (windowed rendering) — deferred; 24/page keeps the DOM small.
- PokeAPI endpoints beyond the two allowed (unless explicitly waived for rich-detail fields — see Risks).

## Product Goals

- Visual parity with the official Figma — every screen and state, in Spanish.
- A smooth, product-like list→detail UX; favorites survive reloads; one-tap share.
- Performance holds across the large catalog (incremental loads, bounded rendering, no full fetch).
- Every state (loading, empty, error, construction) is designed, not accidental.

## Confirmed Product Decisions (Assumptions)

1. **Full Figma scope** — all screens and states above are in scope (realignment, not restart).
2. **UI language**: Spanish; PokeAPI data (names, types, stats) stays English.
3. **Onboarding visual-only** — no real registration/auth.
4. **Entry flow**: Splash → Onboarding 01 → Onboarding 02 → Pokedex (replaces direct `/` landing).
5. **Regiones/Perfil** = "Construcción" screens.
6. **List**: infinite scroll, 24/page (kept).
7. **Favorites**: Pinia + localStorage snapshots with cross-tab sync (kept); Favorites is a Tab.
8. **Search**: local filter on loaded items, debounced (kept); adds result count + clear-filter.
9. **Share**: fixed format (kept) — `{name}, {types}, HP…`.
10. **Loading**: pure-CSS pokeball animation, no image assets (kept).

## Initial Requirements (by area)

- **Data fetching**: MUST use only the two allowed endpoints (rich-field sourcing pending — Risks). MUST paginate (never load all). SHOULD cache fetched pages. MUST handle loading and error states.
- **State**: MUST keep favorites in a Pinia store, persist to localStorage, rehydrate on init, expose add/remove/is-favorite. SHOULD persist an onboarding-seen flag (skip logic — open).
- **UI (Spanish)**: MUST render Splash, Onboarding 01/02, 4-item TabBar, Figma list cards, rich detail, filter BottomSheet, Favorites tab with trash + empty state, Error and Construcción states, CSS pokeball loader. MUST map the 18 types to Spanish names, colors, and icons (local constants).
- **Filtering**: MUST filter by type (BottomSheet) with result count and clear-filter. Filter scope (loaded pages vs. catalog) — open.
- **Detail**: MUST show the Figma fields including Próximo/Anterior navigation.
- **Sharing**: MUST copy the fixed format; MUST degrade gracefully when Clipboard API is unavailable.
- **a11y**: keyboard-operable list; `aria-busy` during fetches; `aria-pressed` on favorite controls; alt text; focus management on navigation.

## Capabilities

> Contract for sdd-spec. `openspec/specs/` is empty (greenfield). Four delta specs already exist in this change (`pokemon-list`, `pokemon-detail`, `favorites`, `share`) and need UPDATES; four new capabilities need new specs.

### New Capabilities
- `onboarding-flow`: Splash + Onboarding 01/02 (visual-only), dots paginator, CTA flow, skip-after-first-visit.
- `navigation-tabbar`: 4-item TabBar (Pokedex/Regiones/Favoritos/Perfil), active/inactive states, tab switching; Regiones/Perfil → Construcción.
- `type-filter`: BottomSheet filter by type (18 types, Aplicar/Cancelar), result count, "Borrar filtro".
- `feedback-states`: shared Error screen ("Algo salió mal..." + Reintentar) and Construcción ("¡Muy pronto disponible!") screens.

### Modified Capabilities
- `pokemon-list`: Figma cards (Nº, name, types, type-colored background), Spanish copy, search + result count + clear filter, first-page error uses the shared Error screen.
- `pokemon-detail`: expands to the Figma rich detail (description, Peso/Altura/Categoría/Habilidad/Género, Debilidades chips, Próximo/Anterior), replacing the simple "ver más" expandable.
- `favorites`: trash removal from the Favorites tab + Figma empty state; snapshot persistence kept.
- `share`: format unchanged (fixed); surfaces from the rich detail panel.

## Approach

- Vue 3.5 Composition API (`<script setup>`) + TS 6, Pinia setup store, Vue Router. Entry flow: Splash → Onboarding (1–2) → `/` TabBar shell; onboarding-seen flag in localStorage.
- Thin typed API layer (`src/services/pokeapi.ts`) exposing exactly the two endpoints; in-memory per-name detail cache (kept).
- Single `usePokemonStore` owns list pages, favorites, active tab, filter, and selected detail (kept).
- TabBar as the app shell layout hosting Pokedex/Favoritos (real views) and Regiones/Perfil (shared Construcción view).
- Type filter: BottomSheet UI; local filter over loaded pages with result count; clear-filter resets (exclusivity decided in spec/design).
- Rich detail: Figma field panel; Próximo/Anterior via loaded-list index; description/categoría/género/debilidades resolved in spec/design — local data (type-chart constant, bundled/derived text) preferred to preserve the 2-endpoint rule.
- Local type map: 18 types → Spanish label, color, icon (Figma palette) as constants.
- Infinite scroll via IntersectionObserver sentinel with guards (kept); favorites localStorage try/catch + `storage`-event sync (kept); share via `navigator.clipboard` + `execCommand` fallback (kept); CSS pokeball loader with `prefers-reduced-motion` (kept).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/views/` (Splash, Onboarding, PokedexList, PokemonDetail, Favorites, Regiones, Perfil) | New/Modified | Figma screens + TabBar shell |
| `src/components/` (TabBar, TypeFilterBottomSheet, PokemonCard, RichDetailPanel, ErrorState, ConstructionState, EmptyState, SearchBar, PokeballLoader) | New/Modified | Figma UI components |
| `src/stores/pokemon.ts` | New | list + favorites + tab + filter + detail state |
| `src/services/pokeapi.ts`, `src/services/storage.ts` | New | 2 endpoints + persistence |
| `src/data/types.ts` (or similar) | New | 18-type ES name/color/icon map (+ rich-field data — open) |
| `src/router/index.ts` | Modified | entry flow + tab routes + `/pokemon/:name` |
| `src/App.vue` | Modified | app shell (header, router-view) |
| `src/__tests__/` | New | store + component + integration unit tests |
| `README.md` | Modified | tech summary + decisions |

## Risks & Open Product Decisions

| Risk / Open decision | Likelihood | Mitigation / Notes |
|------|------------|------------|
| Rich-detail fields (description, categoría, género, debilidades) are NOT in `GET /pokemon/{name}` — species/type endpoints would break the 2-endpoint rule | High | Prefer local data (type-chart constant, bundled/derived species text) or graceful "—" fallback; only with explicit user OK use extra endpoints; decide in spec/design |
| Type filter over a paginated list: loaded pages only (partial results) vs. full catalog (breaks 2-endpoint rule) | Med | Propose: filter loaded pages + result count, document partial-results caveat; decide in spec |
| Onboarding skip after first visit (always show vs. localStorage flag) | Open | Propose: local flag `pokemon-onboarding-seen`; decide in spec |
| Splash duration (fixed N seconds vs. until ready) | Open | Propose: fixed ~1.5 s; decide in spec |
| Type filter exclusive vs. multiple | Open | Propose: single-select (Figma "Aplicar"); decide in spec |
| 18-type ES names/colors/icons + Magikarp illustration assets | Med | Local constants + inline SVG/CSS; no new dependencies |
| Figma copy is Portuguese → Spanish | Med | Full Spanish string pass in spec; PokeAPI data stays English |
| PokeAPI rate limiting / slow responses | Med | Only 2 endpoints, 24/page, cached pages, loading states |
| Infinite-scroll jank at scale | Med | Small pages, IntersectionObserver, no virtualization needed |
| Scope growth (~2× original) → review budget | Med | Chained PRs, small work units (see tasks.md forecast) |
| localStorage disabled/quota | Low | try/catch + in-memory fallback |
| Clipboard API unavailable (non-secure context) | Low | `execCommand` fallback + visible error state |
| Demo `counter` references break | Med | Remove store + update `App.spec.ts` in same change |

## Rollback Plan

Client-only change: revert the feature commits (chained PR slices) to restore the scaffold. No DB/migrations. localStorage keys are namespaced (`pokemon-favorites`, onboarding flag); clearing storage restores a clean state.

## Dependencies

- PokeAPI (public, no key) — constrained to the two allowed endpoints.
- Figma reference: `openspec/changes/pokemon-favorites/figma-design-notes.md` (palette, typography, copy).
- Existing scaffold deps: Vue 3.5, Pinia 4, Vue Router, Vitest 4, Playwright, TS 6, Vite 8.

## Success Criteria

- [ ] All Figma screens/states implemented in Spanish: Splash, Onboarding 01/02, TabBar (4), Pokedex (search + type filter + result count), rich detail, Favorites (trash + empty state), Error + Construcción.
- [ ] Only the two allowed API endpoints used (list pages + one detail per viewed Pokémon); rich-detail fields resolved locally, no extra calls.
- [ ] Favorites persist across reloads; removable from the Favorites tab; empty state renders.
- [ ] Type filter works (result count + "Borrar filtro"); detail Próximo/Anterior navigates.
- [ ] Share copies the fixed comma-separated format to the clipboard.
- [ ] `npm run test:unit -- --run` passes; `npm run type-check` passes.
- [ ] README documents stack and key decisions.
