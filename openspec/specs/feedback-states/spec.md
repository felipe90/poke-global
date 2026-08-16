# feedback-states Specification

> New capability (greenfield — no prior spec for this domain).
> Figma Error screen ("Algo salió mal..." + Reintentar, Magikarp) and Construcción screen ("¡Muy pronto disponible!", Magikarp), shared across the app.

## Purpose

Two shared, reusable full-screen states: **Error** (used for list first-page failures, detail fetch failures, and other fatal load failures) and **Construcción** (used by Regiones/Perfil). Both feature a decorative Magikarp illustration built inline (SVG/CSS — no external image assets).

## Requirements

### Requirement: Shared Error screen

The system MUST provide a reusable Error screen rendering the exact copy — title `Algo salió mal...`, subtitle `No pudimos cargar la información...` — a `Reintentar` CTA, and a decorative Magikarp illustration. Activating `Reintentar` MUST re-issue exactly the operation that failed (first list page, pokemon detail, or type-catalog apply, per the calling spec). The screen MUST announce itself to assistive tech (e.g. `role="alert"` / `aria-live`).

#### Scenario: Error on list first page

- GIVEN the first list page request fails
- WHEN the error state renders
- THEN the exact Error copy and `Reintentar` show with Magikarp
- AND activating `Reintentar` re-issues the first-page request

#### Scenario: Error on detail

- GIVEN a detail request fails
- WHEN the error state renders
- THEN the same Error screen shows (retry re-issues the detail request)

#### Scenario: Error announced

- GIVEN the Error screen renders
- WHEN assistive tech is active
- THEN the error message is announced without focus loss to the document

### Requirement: Shared Construcción screen

The system MUST provide a reusable Construcción screen rendering the exact copy — title `¡Muy pronto disponible!`, subtitle `Estamos trabajando para traerte esta sección` — and the decorative Magikarp illustration. It MUST render inside the app shell (TabBar visible) and MUST NOT issue any network request.

#### Scenario: Regiones shows construction

- GIVEN the user activates the Regiones tab
- WHEN the view renders
- THEN the exact Construcción copy with Magikarp shows and no API call is issued

#### Scenario: Perfil shows construction

- GIVEN the user activates the Perfil tab
- WHEN the view renders
- THEN the same Construcción screen shows

### Requirement: Magikarp illustration

The Magikarp illustration MUST be a single reusable inline asset (SVG or pure CSS) shared by both screens, decorative (`aria-hidden`, no alt requirement), with no external image files or new dependencies.

#### Scenario: No image assets

- GIVEN the app source
- WHEN the illustration is inspected
- THEN it renders from inline SVG/CSS and no external image asset is loaded

### Requirement: Visual and accessibility consistency

Both screens MUST render on the `#fafafa` background with Figma typography (title `#121212`, subtitle `#424242`), be keyboard-operable (`Reintentar` focusable), and honor `prefers-reduced-motion` for any decorative animation.

#### Scenario: Reduced motion

- GIVEN the user prefers reduced motion
- WHEN a state screen renders
- THEN decorative animations are suppressed

## Resolved Decisions

- **Copy**: exact Spanish strings from the Figma (title/subtitle/CTA per screen).
- **Magikarp**: one inline reusable illustration (SVG/CSS), no asset files, decorative only.
- **Retry scope**: `Reintentar` replays the exact failed operation of the caller (list page, detail, or type-catalog apply) — each caller wires its own retry; the screen is presentation + CTA.
- **Usage map**: Error → `pokemon-list` first-page, `pokemon-detail` fetch, `type-filter` inline apply error; Construcción → `navigation-tabbar` Regiones/Perfil.
