# Will’s 3-2-1 — Project Notes (Handoff)
_Date:_ 2025-09-07

## Prime directives
- **Single Source of Truth:** Blueprint / Changelog / Brief are authoritative.
- **State-first UI:** Event → Update State → Render from `appState`.
- **Tokens everywhere:** Spacing and rhythm use variables; avoid per-element pixel nudges.
- **No hacks:** No sub-1 line-height, no negative padding, no `!important`.

## Global tokens (relevant to layout)
- `--space-s: 7px`  (tight rhythm)
- `--space-m: 16px` (standard rhythm / card inset / inter-block)
- `--card-border-width: 2px`
- `--lh-normal: 1.2`
- `--cap-offset-h2: 5px`  ← _visual cap/leading compensation for 1.25rem headings_

## Visual rhythm (CEMENT)
- **Targets:** 16px top inset from card edge, **7px** header → selector, **16px** between groups.
- **Mechanic:** Use containers and `gap`; use small **flow-aware margins** (±`--cap-offset-h2`) on headers to cancel font leading.
- **Border-aware inset:** `padding: calc(var(--space-m) - var(--card-border-width, 2px));`

## Typography (merged)
File: `src/styles/base/_typography.css`
- Global font: `"Roboto", sans-serif`.
- `h2`: `line-height: var(--lh-normal); margin: 0;` (no UA margins)
- Utilities (available anywhere):
  - `.heading-cap-fix`, `.heading-cap-fix--top`, `.heading-cap-fix--bottom`, `.heading-cap-fix--reset`
  - All driven by `--cap-offset-h2` (5px).

## Config card (locked & pixel-perfect)
File: `src/features/config-card/config-card.style.css`
- Card inset: border-aware 16px.
- All headers get flow-aware negative margins:
  - `margin-top: calc(var(--cap-offset-h2) * -1)`
  - `margin-bottom: calc(var(--cap-offset-h2) * -1)`
- Header → selector gap comes from the group’s **7px** stack gap.
- Truncation is **disabled** in headers for now (stability).

## Active Exercise card (scoped fix already applied)
File: `src/features/active-exercise-card/active-exercise-card.style.css`
- **Scoped min-height** rule to avoid leaking into other cards:
  - `#active-card-container .app-selector > summary { min-height: 110px; }`
- Next: remove old `line-height: 0.7` “shrink box” hacks and replace with the same cap-fix margins used on the config card; keep 16/7/16 rhythm.

## DO / DON’T (CEMENT)
- **DO:** Use `gap` for vertical rhythm; keep text line-height ≥ `var(--lh-normal)`.
- **DO:** Compensate heading leading via **margins**, not transforms.
- **DO:** Use **tokens** for all spacing (`margin/padding/gap/inset`).
- **DON’T:** Use sub-1 line-height, negative padding, or `!important`.
- **DON’T:** Add global rules for generic elements (like `summary`) without scoping.

## Changed this session
- `src/styles/base/_typography.css` — merged base + utilities; set `--cap-offset-h2: 5px`.
- `src/features/config-card/config-card.style.css` — flow-aware margin pattern; truncation disabled.
- `src/features/active-exercise-card/active-exercise-card.style.css` — scoped `summary` min-height to the active card.

## Next steps (for the next session)
1. **Active Exercise card**: replace old header hacks with the cap-fix margins + 16/7/16 rhythm.
2. Re-enable truncation **only where useful** after spacing is stable.
3. Propagate the pattern to remaining cards.

---
## Quick “kickoff” prompt to paste for the next session

> You are the expert front-end dev for Will’s 3-2-1. Use the attached ZIP and the `PROJECT_NOTES.md` as the single source of truth. Maintain tokenized layout: 16px card inset, 7px header→selector, 16px group spacing. Do not use sub-1 line-height. Use `--cap-offset-h2: 5px` and flow-aware margins to compensate heading leading. Truncation stays off in headers for now. Start by updating `active-exercise-card.style.css`: remove any `line-height: 0.7` hacks, apply the margin pattern, keep the scoped `summary` min-height, and deliver **full files only** for anything you modify. Briefly justify each change.
