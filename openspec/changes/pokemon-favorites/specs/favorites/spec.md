# favorites Specification

> Full spec (greenfield — `openspec/specs/` has no prior spec for this domain).
> Realigned 2026-08-15 to the Figma: Favorites is a TabBar tab (`/favorites`), per-item trash removal from the list, Figma empty state, tap-to-detail. Snapshot persistence and cross-tab sync kept.

## Purpose

Favorites: a Pinia store backed by localStorage, toggleable from list and detail, rendered in the Favorites tab with per-item trash removal. Survives reloads with no server work; navigates to detail on tap.

## Data Contracts

| Type | Shape |
|------|-------|
| `FavoritePokemon` | `{ name: string; id: number; imageUrl: string \| null; types: string[]; addedAt: string }` — `addedAt` is ISO 8601 |

Persisted as an array of `FavoritePokemon` under the namespaced localStorage key `pokemon-favorites`.

## Requirements

### Requirement: Toggle favorites from list and detail

The system MUST support adding, removing, and checking a Pokemon's favorite state from both the list card and the detail view, with immediate visual feedback.

#### Scenario: Add favorite

- GIVEN a pokemon that is not a favorite
- WHEN its favorite control is activated
- THEN it is added with a snapshot (`name`, `id`, `imageUrl`, `types`, `addedAt`)
- AND the control reflects the favorite state (visual + `aria-pressed`)

#### Scenario: Remove favorite

- GIVEN a pokemon that is a favorite
- WHEN its favorite control is activated
- THEN it is removed and the control reflects the non-favorite state

### Requirement: Persistence and rehydration

The store MUST persist the full favorite list to localStorage (key `pokemon-favorites`) on every mutation and rehydrate on store initialization; storage failures (disabled/quota) MUST fall back to in-memory-only without crashing or losing the session's toggles.

#### Scenario: Reload survival

- GIVEN two favorites exist and are persisted
- WHEN the page reloads and the store initializes
- THEN both favorites are restored from localStorage

#### Scenario: Storage unavailable

- GIVEN localStorage is unavailable or throws
- WHEN a toggle occurs
- THEN the toggle still works for the session and no error surfaces

### Requirement: Favorites tab with trash removal

The system MUST render favorites in the Favorites tab (route `/favorites`, reached from the TabBar) listing favorited Pokemon from their persisted snapshots with no network requests. Each row MUST expose a trash control (`#cd3131` danger styling) that removes that favorite immediately and persists the change; tapping the card MUST navigate to the pokemon's detail route.

#### Scenario: Favorites listed from snapshot

- GIVEN persisted favorites exist
- WHEN the Favorites tab renders
- THEN each favorite shows its name and image from the snapshot and no network request is issued

#### Scenario: Trash removes favorite

- GIVEN a favorite is listed
- WHEN its trash control is activated
- THEN it is removed from the list and from the persisted store, and the detail/list favorite controls no longer show it as favorite

#### Scenario: Tap navigates to detail

- GIVEN a favorite card is rendered
- WHEN it is activated
- THEN the app navigates to `/pokemon/{name}` and the detail renders from the cache or a fetch

### Requirement: Empty state (Figma copy)

The Favorites tab MUST render an empty state when no favorites exist, with the exact copy: title `No has marcado ningún Pokémon como favorito` and subtitle `Haz clic en el ícono de corazón de tus Pokémon favoritos y aparecerán aquí.`

#### Scenario: Empty favorites

- GIVEN no favorites exist
- WHEN the Favorites tab renders
- THEN the empty state with the exact Figma copy renders instead of the list

#### Scenario: Empty state disappears on first add

- GIVEN the empty state is showing
- WHEN a favorite is added from the list or detail
- THEN the Favorites tab shows the newly added pokemon instead of the empty state

### Requirement: Cross-tab synchronization

When favorites change in one tab, other open tabs SHOULD reflect the change (via the `storage` event); on any write the persisted data MUST be the complete current list (last-write-wins, never corrupted).

#### Scenario: Sync between tabs

- GIVEN two tabs with the app open
- WHEN favorites change in tab A
- THEN tab B updates its store from the storage event

## Resolved Decisions

- **Persisted favorite** = snapshot (`name`, `id`, `imageUrl`, `types`, `addedAt`) so the Favorites tab renders offline, without refetching details.
- **Removal**: per-item trash in the list (Figma); single source of truth is the Pinia store + localStorage.
- **Cross-tab sync**: `storage` event (SHOULD, cheap, keeps tabs consistent).
- **Failure mode**: localStorage try/catch fallback to memory-only (never crashes).
- **Navigation**: tapping a favorite opens the detail; favorite state stays consistent because the store is shared.
