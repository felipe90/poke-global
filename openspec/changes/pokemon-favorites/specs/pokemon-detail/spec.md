# pokemon-detail Specification

> Full spec (greenfield — `openspec/specs/` has no prior spec for this domain).
> Realigned 2026-08-15 to the Figma: rich detail panel (Nº, description, Peso/Altura/Categoría/Habilidad/Género, Debilidades chips, Próximo/Anterior), replacing the expandable "ver más" summary. Adds `GET /pokemon-species/{id}` (cached) and a local static 18-type weakness chart.

## Purpose

Fetches and renders a single Pokemon at `/pokemon/:name` as the Figma rich detail: `GET /api/v2/pokemon/{name}` for core fields (cached in memory by name) plus `GET /api/v2/pokemon-species/{id}` for description/categoría/género (cached in memory by id). Debilidades come from a LOCAL static 18-type chart — zero API calls. Próximo/Anterior navigate within the list context the user came from.

## Data Contracts

| Type | Shape |
|------|-------|
| `PokemonDetail` | `{ id: number; name: string; height: number; weight: number; types: { slot: number; type: { name: TypeName } }[]; stats: { base_stat: number; stat: { name: string } }[]; abilities: { slot: number; ability: { name: string } }[]; sprites: { front_default: string \| null; other: { "official-artwork": { front_default: string \| null } } }; species: { url: string } }` |
| `PokemonStats` | `{ hp: number; attack: number; defense: number; "special-attack": number; "special-defense": number; speed: number }` — extracted by `stat.name` |
| `PokemonSpecies` | `{ flavor_text_entries: { flavor_text: string; language: { name: string }; version: { name: string } }[]; genera: { genus: string; language: { name: string } }[]; gender_rate: number }` — `gender_rate` -1 = genderless; 0–8 = female ratio /8 |
| `WeaknessChart` | `Record<TypeName, TypeName[]>` — local static constant mirroring each type's `damage_relations.double_damage_from` (e.g. `electric: ["ground"]`) |
| `TypeName` | `"grass" \| "fire" \| "water" \| "electric" \| "psychic" \| "poison" \| "normal" \| "bug" \| "fighting" \| "ground" \| "rock" \| "ice" \| "fairy" \| "ghost" \| "dragon" \| "dark" \| "steel" \| "flying"` |

Allowed PokeAPI endpoints (MUST NOT call any other): `GET /api/v2/pokemon`, `GET /api/v2/pokemon/{name}`, `GET /api/v2/pokemon-species/{id}`, `GET /api/v2/type/{type}`.

## Requirements

### Requirement: Detail loading with in-memory cache

(Resolved decision: cache is in-memory, keyed by `name`, session-lifetime, never persisted.) The detail MUST be fetched from `GET /api/v2/pokemon/{name}` only when not cached; cached details MUST be reused across visits.

#### Scenario: First visit fetches

- GIVEN a pokemon not yet cached
- WHEN the detail route is opened
- THEN a single detail request is issued and a pokeball loader is shown

#### Scenario: Cached visit skips fetch

- GIVEN a pokemon already fetched this session
- WHEN the detail route is reopened
- THEN no new request is issued and cached data renders immediately

#### Scenario: Failed fetch is not cached

- GIVEN a detail request fails
- WHEN the error is received
- THEN nothing is stored in the cache and the next visit issues a fresh request

### Requirement: Species loading with in-memory cache

The species data MUST be fetched from `GET /api/v2/pokemon-species/{id}` at most once per pokemon id per session (in-memory cache keyed by id, never persisted), using the `species.url` of the loaded detail. It supplies description, categoría, and género; its failure MUST NOT block the rest of the detail (fields degrade to `—`).

#### Scenario: Species fetched once per id

- GIVEN a detail is loaded for pikachu (id 25)
- WHEN the detail view mounts
- THEN exactly one `pokemon-species/25` request is issued
- AND revisiting pikachu later in the session issues no new species request

#### Scenario: Species failure degrades gracefully

- GIVEN the species request fails
- WHEN the error is received
- THEN description, categoría, and género render `—` and the rest of the detail panel remains visible

### Requirement: Rich detail panel (Figma fields)

The detail MUST render, without any "ver más" expansion: Nº (`Nº` + 3-digit padded id), name, official-artwork image, description, Peso, Altura, Categoría, Habilidad, Género, Debilidades chips, and all six base stats. Types MUST render ordered by `slot` with their Spanish labels/colors from the 18-type local map.

#### Scenario: All Figma fields render

- GIVEN a loaded detail for bulbasaur with its species
- WHEN the view renders
- THEN `Nº001`, `Bulbasaur`, the artwork, the ES description, `Peso 6,9 kg`, `Altura 0,7 m`, `Categoría Pokémon Semilla`, `Habilidad Overgrow`, `Género 87,5% / 12,5%`, Debilidades chips (`Fuego`, `Hielo`, `Volador`, `Psíquico`), and the six stats are visible

#### Scenario: Type order by slot

- GIVEN a dual-type pokemon (bulbasaur: `grass` slot 1, `poison` slot 2)
- WHEN the type chips render
- THEN they appear as `Planta`, `Veneno` in slot order

#### Scenario: Stat values rendered

- GIVEN the detail for pikachu is rendered
- WHEN the stat list is inspected
- THEN HP 35, Attack 55, Defense 40, and Speed 90 render (API `base_stat` values)

### Requirement: Derived fields

- **Peso**: `weight` (hectograms) ÷ 10 in kg with comma decimal separator (e.g. `6,9 kg`).
- **Altura**: `height` (decimetres) ÷ 10 in m with comma decimal separator (e.g. `0,7 m`).
- **Categoría**: Spanish `genus` from `genera` (`language.name === "es"`); fallback English genus, then `—`.
- **Descripción**: Spanish `flavor_text` from `flavor_text_entries` (`language.name === "es"`), preferring the latest `version`, with newlines/form feeds collapsed; fallback English entry, then `—`.
- **Género**: `gender_rate` -1 → `Sin género`; otherwise `{male}% / {female}%` with comma decimals, male first (`male = (8 - rate) / 8 * 100`, `female = rate / 8 * 100`).
- **Habilidad**: the slot-1 `ability.name` from the detail, rendered capitalized English (API value); no ES dictionary in scope.
- **Debilidades**: from the local `WeaknessChart` constant for the pokemon's types (union, deduped, in chart order), rendered as type chips with Spanish labels — MUST NOT trigger any API call.

#### Scenario: Gendered pokemon percentages

- GIVEN bulbasaur (`gender_rate` 1)
- WHEN the Género field renders
- THEN it shows `87,5% / 12,5%`

#### Scenario: Genderless pokemon

- GIVEN a pokemon with `gender_rate` -1 (e.g. magnemite)
- WHEN the Género field renders
- THEN it shows `Sin género`

#### Scenario: Weaknesses from local chart only

- GIVEN the detail for pikachu (electric)
- WHEN the Debilidades section renders
- THEN it shows a single `Tierra` chip
- AND no type endpoint request is issued

### Requirement: Próximo/Anterior navigation

The detail MUST provide `Próximo` and `Anterior` controls navigating within the ordered list context used to reach the detail (loaded catalog pages, or the active filtered/search set when one was active). At the first/last item of that context the corresponding control MUST be disabled. Navigating loads the adjacent pokemon's detail through the same caches (no list refetch).

#### Scenario: Navigate to next

- GIVEN the detail is reached from a catalog list where bulbasaur is index 0 of 24
- WHEN `Próximo` is activated
- THEN the route changes to the next pokemon in the same ordered context and its detail renders

#### Scenario: Bounds disabled

- GIVEN the detail of the last item in the current context
- WHEN the view renders
- THEN `Próximo` is disabled (and symmetrically `Anterior` for the first item)

#### Scenario: Navigation respects filter context

- GIVEN the user applied the `grass` filter and opened the 2nd pokemon of the filtered set
- WHEN `Próximo` is activated
- THEN the route changes to the 3rd pokemon of the FILTERED set (not the raw catalog order)

### Requirement: Detail error state with retry

The detail view MUST show a dedicated error state with Retry on fetch failure.

#### Scenario: Fetch failure

- GIVEN a detail request fails
- WHEN the error is received
- THEN an error state with a Retry control renders instead of the summary
- AND retrying re-issues the request

#### Scenario: Unknown pokemon (404)

- GIVEN a route name with no matching pokemon
- WHEN the request resolves 404
- THEN a not-found state renders with a link back to the list

### Requirement: Non-functional behavior

- The species request MUST be non-blocking: the core panel renders before description/categoría/género resolve, without layout jump beyond the field text.
- `prefers-reduced-motion` MUST disable decorative animations (loader, transitions).
- Type chips, Debilidades, and Nº MUST be announced accessibly (text, not color alone).

#### Scenario: Reduced motion

- GIVEN the user prefers reduced motion
- WHEN the loader or transitions would animate
- THEN animations are suppressed while the flow and content remain intact

## Resolved Decisions

- **Cache**: detail by `name`, species by `id` — separate in-memory maps (session lifetime, not persisted). One detail request + one species request per pokemon per session.
- **Weaknesses**: local static `WeaknessChart` (18 types) mirroring the verified `double_damage_from`; zero type-endpoint calls from the detail.
- **Rich panel replaces "ver más"**: the Figma shows all fields at once; no expand/collapse.
- **Habilidad**: API value capitalized in English (e.g. `Overgrow`); a full ES ability dictionary is out of scope.
- **Próximo/Anterior**: index-based within the current ordered context (filtered set when active, else loaded catalog); disabled at bounds; detailed mechanism is a design decision (route param vs. store).
