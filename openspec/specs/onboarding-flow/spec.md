# onboarding-flow Specification

> New capability (greenfield — no prior spec for this domain).
> Figma-fixed entry flow: Splash → Onboarding 01 → Onboarding 02 → Pokedex. Visual-only (no registration/backend). No skip.

## Purpose

Boot flow identical to the Figma: an animated Splash (pure-CSS pokeball loader) followed by two onboarding screens with Spanish copy, a 2-dot paginator, and CTAs `Continuar` / `Empecemos`. The flow is FIXED — it runs on every cold load and cannot be skipped or persisted via localStorage.

## Requirements

### Requirement: Splash with CSS pokeball loader

The app MUST boot into a Splash screen showing an animated pokeball built with pure CSS (`@keyframes`), decorative and `aria-hidden`, that auto-advances to Onboarding 01 after a FIXED duration of 1500 ms. No image assets and no JS animation library MAY be used.

#### Scenario: Splash auto-advances

- GIVEN the app loads
- WHEN 1500 ms elapse
- THEN the app navigates to Onboarding 01 without user interaction

#### Scenario: Reduced motion

- GIVEN the user prefers reduced motion
- WHEN the Splash shows
- THEN the pokeball animation is suppressed but the 1500 ms auto-advance still occurs

### Requirement: Onboarding 01

Onboarding 01 MUST render the exact Spanish copy — title `Todos los Pokémon en un solo lugar`, subtitle `Accede a una amplia lista de Pokémon de todas las generaciones creadas por Nintendo` — a CTA button `Continuar`, and a 2-dot paginator with the first dot active. Activating `Continuar` MUST navigate to Onboarding 02.

#### Scenario: Continue to step 2

- GIVEN Onboarding 01 is showing
- WHEN `Continuar` is activated
- THEN Onboarding 02 renders with the second dot active

### Requirement: Onboarding 02

Onboarding 02 MUST render the exact Spanish copy — title `Mantén tu Pokédex actualizada`, subtitle `Regístrate y guarda tu perfil, Pokémon favoritos, configuraciones y mucho más` — a CTA button `Empecemos`, and the 2-dot paginator with the second dot active. Activating `Empecemos` MUST navigate to the Pokedex tab (list). This screen is VISUAL-ONLY: it MUST NOT create an account, call an API, or persist profile data.

#### Scenario: Enter the app

- GIVEN Onboarding 02 is showing
- WHEN `Empecemos` is activated
- THEN the app navigates to `/` (Pokedex tab) and no registration API call is issued

### Requirement: Fixed, non-skippable flow

The entry flow MUST run on every cold app load: Splash → Onboarding 01 → Onboarding 02 → Pokedex. It MUST NOT persist an onboarding-seen flag and MUST NOT offer a skip control; no route within the app is reachable before the flow completes.

#### Scenario: Flow always runs

- GIVEN a fresh app load
- WHEN the router initializes
- THEN Splash renders first, followed by Onboarding 01 and 02 before any other route

#### Scenario: No skip, no persistence

- GIVEN the flow is in progress
- WHEN the user inspects localStorage and the UI
- THEN no onboarding-seen key is written and no skip control exists

### Requirement: Accessibility

The flow MUST be keyboard-operable; the paginator dots MUST carry accessible names (step 1 of 2 / step 2 of 2); CTAs MUST be focusable buttons with the focus visible.

#### Scenario: Keyboard through flow

- GIVEN Onboarding 01 is showing
- WHEN the user tabs and activates `Continuar` with the keyboard
- THEN Onboarding 02 renders

## Resolved Decisions

- **Splash duration**: fixed 1500 ms, auto-advance (no "until ready" logic, no skip).
- **No onboarding flag**: decision overturned from the earlier proposal — the Figma flow is fixed; `pokemon-onboarding-seen` is NOT persisted.
- **Reduced motion**: animation off, timing unchanged.
- **Copy**: exact Spanish strings defined above (Figma was Portuguese; decision: Spanish UI).
