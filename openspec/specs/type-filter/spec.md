# type-filter Specification

> New capability (greenfield — no prior spec for this domain).
> Figma BottomSheet "Filtra por tus preferencias": multi-select type checkboxes, Aplicar/Cancelar, joined full-type catalogs, client-side pagination.

## Purpose

BottomSheet type filter on the Pokedex list. The user selects one or more of the 18 types (checkboxes, multi-select per the Figma). On `Aplicar`, the system fetches `GET /api/v2/type/{tipo}` for EACH selected type (cached in memory), joins the full catalogs in memory (deduplicated by name), and the list paginates over that filtered set. `Cancelar` discards pending changes.

## Data Contracts

| Type | Shape |
|------|-------|
| `TypeCatalogResponse` | `{ damage_relations: { double_damage_from: { name: string }[] }; pokemon: { slot: number; pokemon: PokemonSummary }[] }` — full catalog, unpaginated (e.g. electric = 114) |
| `TypeName` | `"grass" \| "fire" \| "water" \| "electric" \| "psychic" \| "poison" \| "normal" \| "bug" \| "fighting" \| "ground" \| "rock" \| "ice" \| "fairy" \| "ghost" \| "dragon" \| "dark" \| "steel" \| "flying"` |
| `TypeMeta` | `{ name: TypeName; esLabel: string; color: string }` — local constant for the 18 types; ES labels: Agua, Dragón, Eléctrico, Hada, Fantasma, Fuego, Hielo, Planta, Bicho, Lucha, Normal, Siniestro, Acero, Roca, Psíquico, Tierra, Veneno, Volador |

Allowed PokeAPI endpoints (MUST NOT call any other): `GET /api/v2/pokemon`, `GET /api/v2/pokemon/{name}`, `GET /api/v2/pokemon-species/{id}`, `GET /api/v2/type/{type}`.

## Requirements

### Requirement: BottomSheet open/close

The filter MUST open as a bottom sheet (slide-up via CSS transform + Vue `<Transition>`, top corners rounded 24px, shared top shadow) with the title `Filtra por tus preferencias`, from a filter control on the list. It MUST close via `Cancelar` (discarding pending selection), the backdrop, or the Escape key, and MUST NOT close on `Aplicar` until the filtered set is ready.

#### Scenario: Open and cancel

- GIVEN the list is showing
- WHEN the filter control is activated
- THEN the sheet slides up with the 18 type options and the title
- AND activating `Cancelar` closes it with no change to the list

#### Scenario: Escape closes

- GIVEN the sheet is open
- WHEN the Escape key is pressed
- THEN the sheet closes without applying pending changes

### Requirement: Multi-select checkboxes

The sheet MUST render the 18 types as checkboxes with Spanish labels (`TypeMeta.esLabel`) and their Figma colors. Multiple types MUST be selectable simultaneously; `Aplicar` MUST be disabled while no type is selected; a visible count of selected types SHOULD show.

#### Scenario: Multiple selection

- GIVEN the sheet is open
- WHEN the user checks `Planta` and `Veneno` and presses `Aplicar`
- THEN both types are applied to the filter

#### Scenario: Aplicar disabled without selection

- GIVEN no type is checked
- WHEN the user inspects `Aplicar`
- THEN it is disabled

### Requirement: Apply joins full type catalogs

On `Aplicar`, the system MUST fetch `GET /api/v2/type/{tipo}` once per selected type (results cached in memory by type for the session), join the `pokemon[]` lists into a single set deduplicated by `name` (a pokemon with both types appears once), and hand that set to the list, which resets to its first slice of 24. The count text MUST read `Se han encontrado {N} resultados` (or `Se ha encontrado 1 resultado`) with N = the joined set size, and `Borrar filtro` MUST appear.

#### Scenario: Apply two types

- GIVEN `grass` and `poison` are selected
- WHEN `Aplicar` is pressed and both catalogs resolve
- THEN two type requests are issued, the union (deduplicated) becomes the filtered set, the list shows its first 24, and the count equals the union size

#### Scenario: Type catalogs cached

- GIVEN `electric` was fetched in a previous apply
- WHEN the user later applies a filter that includes `electric`
- THEN no new request for `electric` is issued

#### Scenario: Result count

- GIVEN a filtered set of 3 pokemon
- WHEN the list renders
- THEN the count text reads `Se han encontrado 3 resultados`

### Requirement: Clear filter

The `Borrar filtro` control (shown while a filter is active) MUST clear the type selection and the search query, restore the unfiltered catalog list, and reset pagination (see `pokemon-list` spec).

#### Scenario: Clear restores catalog

- GIVEN a type filter is applied
- WHEN `Borrar filtro` is activated
- THEN the sheet's selection clears and the catalog list renders from page 0

### Requirement: Apply failure is atomic

If ANY selected type's catalog fetch fails, the filter MUST NOT be applied and no partial joined set MAY be shown; the sheet MUST stay open with an inline error (`Algo salió mal...` + `Reintentar` — reuse `feedback-states` copy) allowing retry of the failed fetches or cancel.

#### Scenario: One catalog fails

- GIVEN `grass` and `poison` are selected and the `grass` fetch fails
- WHEN the error is received
- THEN the sheet remains open, the list is unchanged, and an inline error with `Reintentar` shows
- AND retry re-issues only the failed type request(s)

### Requirement: Accessibility and performance

The sheet MUST behave as a dialog (`role="dialog"`, `aria-modal`), trap focus while open, and restore focus to the trigger on close. Catalog joins MUST be bounded: at most 18 cached type requests per session, union built with a name-based dedupe, and the filtered set never rendered in full (only 24-item slices).

#### Scenario: Focus management

- GIVEN the sheet is open
- WHEN the user tabs
- THEN focus stays within the sheet, and closing it returns focus to the filter trigger

## Resolved Decisions

- **Selection model**: MULTI-select (checkboxes), per the Figma — overturns the earlier single-select proposal.
- **Filter scope**: full joined catalogs from `GET /api/v2/type/{tipo}` (unpaginated, cached); pagination over the filtered set is client-side (slices of 24) — the type endpoint already returns the complete catalog.
- **Atomic apply**: no partial unions; inline retry inside the sheet.
- **Cancel semantics**: `Cancelar`/backdrop/Escape discard the pending selection, reverting to the last applied filter.
