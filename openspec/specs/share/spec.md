# share Specification

> Full spec (greenfield — `openspec/specs/` has no prior spec for this domain).
> Verified 2026-08-15 against the rich detail: the fixed format remains valid and MUST NOT absorb the new species-derived fields (description/categoría/género/debilidades). Share surfaces from the rich detail panel.

## Purpose

One-tap share of a Pokemon summary as plain text copied to the clipboard from the detail view. Uses the already-loaded detail — no extra fetch.

## Requirements

### Requirement: Exact share text

(Resolved decision — exact format.) The share text MUST be exactly `{name}, {types joined by ", "}, HP {hp}, Attack {attack}, Defense {defense}, Speed {speed}`, using API values in English with types ordered by `slot`. It MUST NOT include any species-derived fields (description, categoría, género, debilidades), regardless of the rich detail rendering them.

#### Scenario: Single type

- GIVEN the loaded detail for pikachu
- WHEN share is activated
- THEN the copied text is exactly `pikachu, electric, HP 35, Attack 55, Defense 40, Speed 90`

#### Scenario: Multiple types

- GIVEN the loaded detail for bulbasaur (types `grass`, `poison` by slot)
- WHEN share is activated
- THEN the copied text is exactly `bulbasaur, grass, poison, HP 45, Attack 49, Defense 49, Speed 45`

#### Scenario: Format unchanged by rich detail

- GIVEN the rich detail has loaded description/categoría/género for a pokemon
- WHEN share is activated
- THEN the copied text matches the fixed format exactly and contains none of the species-derived fields

### Requirement: Clipboard copy with fallback

The system MUST copy via `navigator.clipboard.writeText` when available and MUST fall back to `execCommand('copy')` when it is not; no network request is performed during sharing.

#### Scenario: Standard clipboard

- GIVEN `navigator.clipboard.writeText` is available
- WHEN share is activated
- THEN the text is written and success feedback is shown

#### Scenario: Clipboard API unavailable

- GIVEN the Clipboard API is unavailable (e.g. non-secure context)
- WHEN share is activated
- THEN the fallback copies the text and success feedback is shown

### Requirement: Copy feedback and failure

The system MUST show success feedback after a copy and a visible error state when copying fails.

#### Scenario: Copy failure

- GIVEN both copy strategies fail
- WHEN share is activated
- THEN a visible error message renders and no success feedback is shown

## Resolved Decisions

- **Exact format**: `{name}, {types joined by ", "}, HP {hp}, Attack {attack}, Defense {defense}, Speed {speed}` — English labels matching API stat names, types by `slot` order (pikachu → `pikachu, electric, HP 35, Attack 55, Defense 40, Speed 90`).
- **Rich-detail scope**: species-derived fields are display-only; the share text is frozen (verified still valid after the rich-detail realignment).
- **Fallback**: `execCommand('copy')` when `navigator.clipboard` is unavailable; visible failure state otherwise.
- **Surfacing**: share control lives in the rich detail panel (design decides placement).
