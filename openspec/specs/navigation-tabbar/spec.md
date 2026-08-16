# navigation-tabbar Specification

> New capability (greenfield — no prior spec for this domain).
> Figma 4-item TabBar: Pokedex / Regiones / Favoritos / Perfil; Regiones and Perfil render the shared Construcción screen.

## Purpose

App shell TabBar with four items hosting the main sections: Pokedex (list), Regiones (Construcción), Favoritos (favorites list), Perfil (Construcción). Tab switching preserves each tab's state; active/inactive styling follows the Figma palette (`#0d47a1` active, `#424242` inactive).

## Data Contracts

| Route | View | TabBar item |
|-------|------|-------------|
| `/` | Pokedex list | Pokedex (default, active) |
| `/regions` | Construcción screen (`feedback-states`) | Regiones |
| `/favorites` | Favorites list (`favorites` spec) | Favoritos |
| `/profile` | Construcción screen (`feedback-states`) | Perfil |
| `/pokemon/:name` | Rich detail (`pokemon-detail` spec) | Pokedex stays active |

## Requirements

### Requirement: Four-item TabBar

The shell MUST render a fixed TabBar with exactly four items in order — `Pokedex`, `Regiones`, `Favoritos`, `Perfil` — each with its Figma icon; the active item MUST use `#0d47a1` and inactive items `#424242`, with the active state also communicated non-visually (e.g. `aria-current`). The TabBar MUST match the Figma styling (top corners rounded 16px, `box-shadow: 0 -1px 3px rgba(0,0,0,0.12)`).

#### Scenario: Default active tab

- GIVEN the app enters the shell after onboarding
- WHEN `/` renders
- THEN the Pokedex item is active (`aria-current="page"`) and the list view shows

#### Scenario: Switch tabs

- GIVEN the shell is showing
- WHEN the `Regiones` item is activated
- THEN the route becomes `/regions` and the Construcción screen renders with Regiones active

### Requirement: Route-tab binding

Each TabBar item MUST bind to its route from the table above; activating an item MUST update the URL, and navigating to a route MUST activate the matching item. The detail route `/pokemon/:name` MUST render with the TabBar visible and Pokedex active.

#### Scenario: Deep link activates tab

- GIVEN the app is at `/favorites`
- WHEN the page reloads
- THEN the Favoritos item is active and the favorites list renders

#### Scenario: Detail keeps shell

- GIVEN the app is at `/pokemon/pikachu`
- WHEN the shell renders
- THEN the TabBar is visible with Pokedex active

### Requirement: Regiones/Perfil show Construcción

The `Regiones` and `Perfil` tabs MUST render the shared Construcción screen from the `feedback-states` spec (exact copy `¡Muy pronto disponible!` + `Estamos trabajando para traerte esta sección` + Magikarp) instead of real content.

#### Scenario: Regiones construction

- GIVEN the app is at `/regions`
- WHEN the view renders
- THEN the Construcción screen shows and no content API call is issued

#### Scenario: Perfil construction

- GIVEN the app is at `/profile`
- WHEN the view renders
- THEN the Construcción screen shows

### Requirement: State preservation across tab switches

Switching tabs MUST preserve each tab's state: loaded list pages, active filter/search, scroll position of the list, and the favorites list MUST remain as they were when the user returns (no refetch, no reset).

#### Scenario: List state kept

- GIVEN the list has 3 pages loaded and a scroll position
- WHEN the user switches to Favoritos and back to Pokedex
- THEN the same pages, filter state, and scroll position render with no new page request

### Requirement: Accessibility

The TabBar MUST be a `<nav>` landmark; items MUST be keyboard-operable with visible focus; active state MUST not rely on color alone.

#### Scenario: Keyboard navigation

- GIVEN the TabBar is focused
- WHEN the user moves focus with arrow keys and activates an item
- THEN the corresponding route renders

## Resolved Decisions

- **Routes**: `/` (Pokedex), `/regions`, `/favorites`, `/profile`; detail at `/pokemon/:name` keeps the shell.
- **Regiones/Perfil**: shared Construcción screen — no placeholder content beyond the copy.
- **State preservation**: per-tab state kept in the store/keep-alive (design decides mechanism); switching tabs never refetches.
