# Archive Report — pokemon-favorites

**Change**: pokemon-favorites
**Branch**: feature/pokemon-favorites
**Version**: 2026-08-15 (realigned to the official Figma — 8 delta specs)
**Archived**: 2026-08-15
**Mode**: openspec (filesystem only; no Engram)
**Verifier status (dispatcher)**: verify `all_done`, archive `ready`, tasks 40/40, 0 blockers, no CRITICAL findings

> **Intentional archive deviation — change folder retained**: per explicit user instruction, the
> change folder `openspec/changes/pokemon-favorites/` was NOT moved to `openspec/changes/archive/`.
> proposal.md, specs/, design.md, tasks.md, verify-report.md (and figma-design-notes.md) remain in
> place as the evaluation trail. This archive report closes the SDD cycle in place; the standard
> mechanical move (`git mv`/`mv` + snapshot `diff -r` readback) was therefore not performed, and the
> "change folder moved to archive" checkbox does not apply. Only the delta-spec sync used shell
> mechanical copy (cp → temp → `diff -q`/`diff` identity check → mv).

## Summary

Closed the `pokemon-favorites` SDD change: the full Figma app (Splash → Onboarding 01/02, 4-item
TabBar shell, Pokedex list with search + multi-select type filter, rich detail with Próximo/Anterior,
Favorites tab with trash + empty state, Share, Error/Construcción states) was implemented in Spanish
across 6 chained PRs, verified with 211/211 unit tests + type-check + lint + e2e chromium, and all
verify warnings resolved. The 8 delta specs were synced to the top-level `openspec/specs/` source of
truth. No code, config, or test changes were made during this phase.

## Final State

| Area | Status |
|------|--------|
| Delta specs synced to `openspec/specs/{domain}/spec.md` | ✅ 8/8 created (greenfield — `openspec/specs/` had only `.gitkeep`), byte-identical via `diff -r` (only expected `.gitkeep` delta) |
| Tasks | ✅ 40/40 complete (`[x]` in tasks.md, 7 phases) |
| Verify report | ✅ `pass_with_warnings` — 43/43 requirements, 84/84 scenarios, 211/211 tests, type-check exit 0, lint exit 0, e2e chromium 3/3 |
| Warnings | ✅ All 6 resolved/accepted (W-1..W-6; commit `75a0cf7` + W-3 integration test + W-4 dup nav removal + W-5 exact copy + W-6 documented) |
| Blockers / CRITICAL | ✅ None |
| Change folder | Retained in place per user instruction (evaluation trail) |

## Key Design Decisions

- **Endpoint contract 2 → 4 whitelisted**: `GET /pokemon`, `GET /pokemon/{name}`,
  `GET /pokemon-species/{id}`, `GET /type/{tipo}` — user-authorized expansion required by the Figma
  rich detail and type filter; documented as a conscious deviation from the assessment's two-call rule.
- **Type-catalog preload + `nameToTypes` map**: 18 `GET /type/{tipo}` catalogs prefetched once per
  session (≤6 in flight); cards read types with zero per-card detail requests and the filter applies
  from cache (zero network on apply). Approved scalability improvement (replaces the per-card fan-out).
- **Atomic filter union**: `Promise.all` over cached catalogs; any rejection → no partial set, sheet
  stays open with inline retry of failed types only. Client-side slice pagination (24) over the joined set.
- **Fixed Splash→Onboarding flow**: in-memory cold-load guard in the router (`flowComplete`), no
  persisted onboarding flag, no skip — per spec (overturns the earlier localStorage proposal).
- **Rich detail**: species-derived fields (description/categoría/género) fetched once per id,
  non-blocking, degrade to `—`; Debilidades from a local static `WeaknessChart` (zero API); Próximo/
  Anterior via indexed nav context, disabled at bounds and on deep-link.
- **Favorites**: Pinia + localStorage snapshot (`pokemon-favorites`) with cross-tab `storage`-event
  sync, try/catch in-memory fallback; per-item trash in the Favorites tab.
- **Share**: fixed format `{name}, {types}, HP {hp}, Attack {attack}, Defense {defense}, Speed {speed}`,
  frozen against species-derived fields; clipboard primary + `execCommand` fallback + visible error.
- **State preservation**: single `usePokemonStore`; `<KeepAlive>` on shell tabs; no refetch on return.
- **UI**: all copy in Spanish (Figma was Portuguese), 18-type `TYPE_META` map (ES label/color/icon),
  pure-CSS pokeball loader, inline SVG Magikarp, `prefers-reduced-motion` everywhere.

## Known Debt (per README §Known Debt)

- **Fine visual tuning pending evaluator validation**: token-level geometry measured against the Figma
  API, but final human sign-off on composition details (e.g. exact header proportions) is pending.
- **Type preload cost**: 18 type-catalog requests (~2–3 MB JSON) once per session at list init —
  acceptable for a demo; revisit against a real backend budget.
- **WeaknessChart is a static local mirror** of PokeAPI `double_damage_from` — must be updated in
  `src/data/types.ts` if the upstream chart changes.

Additional non-blocking follow-ups (verify suggestions S-5/S-6, documented in verify-report): fix the
`vitest.config.ts` `import "./vite.config"` extension deprecation warning; expand `e2e/vue.spec.ts`
beyond 3 tests toward the full journey.

## Traceability

- **Commits** (feature/pokemon-favorites): `05d3432` PR 1 Foundation · `a3c06b4`+`c7d2339`+`97e3a0e`
  PR 2 Core state · `42c4346` PR 3 Shell/nav · `1cc8386`+`c60034d` PR 4 Components+styles ·
  `4824013`+`fb281cd` PR 5 Views · `9644d2c` orphaned-preload fix · `39727bf` Figma geometry rebuild ·
  `2c1200e` sticky toolbar/pointer-events · `ceeef2e` PR 6 cleanup+README+gates · `75a0cf7` verify
  warnings resolved · `e082bcf` verify report scenario totals (84/84).
- **CHANGELOG.md**: full phase and PR traceability (2026-08-15), including the Figma realignment,
  endpoint expansion, type-preload improvement, and warning-resolution entries.
- **Verify evidence**: ledger revision `sha256:63dac919…`, test output hash `3e15b083…`, build hash
  `2fe39d25…` (verify-report.md).

## Specs Synced (source of truth now updated)

| Domain | Action | File |
|--------|--------|------|
| pokemon-list | Created | `openspec/specs/pokemon-list/spec.md` |
| pokemon-detail | Created | `openspec/specs/pokemon-detail/spec.md` |
| favorites | Created | `openspec/specs/favorites/spec.md` |
| share | Created | `openspec/specs/share/spec.md` |
| onboarding-flow | Created | `openspec/specs/onboarding-flow/spec.md` |
| navigation-tabbar | Created | `openspec/specs/navigation-tabbar/spec.md` |
| type-filter | Created | `openspec/specs/type-filter/spec.md` |
| feedback-states | Created | `openspec/specs/feedback-states/spec.md` |

Verification: `diff -r openspec/changes/pokemon-favorites/specs openspec/specs` returned only the
expected `.gitkeep` placeholder delta; per-file `diff` confirmed byte-identity for all 8 specs.
The synced top-level specs reflect the implemented behavior (each matches the verified requirements in
verify-report.md's compliance matrix).

## Verification of Result Consistency

- 8/8 delta specs sync to `openspec/specs/{domain}/spec.md`, byte-identical (mechanical copy + diff).
- Synced specs mirror the requirements verified as COMPLIANT in verify-report.md (43/43 reqs, 84/84
  scenarios; per-domain counts: pokemon-list 19/19, pokemon-detail 17/17, favorites 10/10, share 6/6,
  onboarding-flow 7/7, navigation-tabbar 8/8, type-filter 10/10, feedback-states 7/7).
- Only files written this phase: the 8 synced specs + this archive report. `src/`, `package.json`,
  config, `tasks.md`, and `verify-report.md` untouched.