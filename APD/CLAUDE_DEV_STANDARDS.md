# CLAUDE DEVELOPMENT STANDARDS

## Purpose

This file contains timeless development standards that guide all work on Will's 3-2-1. These standards should be committed to memory and applied consistently in real-time or after-the-fact. This file is never altered unless explicitly specified by Will or Claude proposes changes with discussion.

**Standards Application**: Development progress comes first. Apply these standards as best as possible during implementation, but never let them block a requested feature. When necessary (e.g., !important flags, cascade conflicts), prioritize working functionality. Standards can be refined and applied after-the-fact.

---

## CORE PHILOSOPHY
- **SUPER STUPID SIMPLE (SSS)**: The user experience must be effortless and guided
  - Remove complexity, avoid feature creep
- **REMOVE, DON'T ADD**: When faced with complexity, the first instinct should be to simplify or remove
- **Touch-first design**: No hover, no mouse events, immediate UI responses

## ACTIVE DEVELOPMENT STANDARDS

### 1. SESSION HANDOFF DOCUMENTATION
Document key changes and handoff notes in `CLAUDE_SESSION_HANDOFF.md`.

### 2. CSS SPECIFICITY OVER !IMPORTANT
Use proper CSS cascade: `.component.state-class`, three-class specificity, `:has()`, ID selectors where appropriate.

### 3. TOKEN-BASED CSS SYSTEM
Global-first with 16px rhythm: `var(--space-m)`, `var(--color-primary)`. Local exceptions documented inline.

### 4. SEMANTIC NAMING CONVENTION
Purpose-driven classes: `.action-button.button-danger` not `.red-button`. Update as architecture evolves.

### 5. CLEAR SECTION HEADERS
Code comments should include clear section headers to organize code logically. Use `=== SECTION NAME ===` format in CSS, descriptive headers in JavaScript.

### 6. CEMENT COMMENTS - LEGACY PATTERN (PHASING OUT)
🔒 CEMENT comments mark code that had critical recurring issues in the past.
- **Keep existing CEMENT comments in place** - Do not remove them
- **Only add new CEMENT for utmost important recurring issues** - Use sparingly
- **Slowly phasing out** - Prefer clear documentation over CEMENT markers
- When updating files, convert CEMENT to detailed explanation where appropriate

### 7. GIT BRANCH SYNCHRONIZATION
Always work on the same branch shown in VS Code's bottom-left corner. Verify with `git branch --show-current` at session start.

### 8. COMMIT POLICY
Do not commit changes unless explicitly requested by the user. Let the user review changes in VS Code and handle commits themselves.

## FILE HEADERS

**CSS Files**:
```css
/* ==========================================================================
   COMPONENT NAME - Purpose

   Description and role.

   Dependencies: Global/Parent/Local tokens
   Used by: Dependent components
   ========================================================================== */
```

**JavaScript Files**:
```javascript
/* ==========================================================================
   COMPONENT NAME - Purpose

   Description and critical notes.

   Dependencies: Services, utilities, state
   Used by: Components that import this
   ========================================================================== */
```

**CRITICAL**: NO VERSION NUMBERS in file headers (git tracks this).

## KEY PATTERNS

**State Flow**: Action → Service → `appState` → `renderAll()` → `persistenceService.saveState()`

**Animation Performance**: GPU-accelerated with `will-change`, NO `!important` in keyframes.

**Component Pattern**: `feature.index.js`, `feature.template.js`, `feature.style.css`

**One-Selector-To-Rule-Them-All**: Exclusive selector interaction pattern
- **Rule**: Only ONE selector active at a time across the entire application
- **External Muting**: When a selector opens, ALL external selectors are muted/disabled
- **Internal Freedom**: Selectors within the same component group can remain active
- **Nesting**: When a nested selector opens, its siblings become external and get muted
- **Examples**:
  - Config-card selector open → Current Exercise selector (external) muted
  - Config-card selector open → Current Plan/Focus selectors (internal) can open
  - Current Plan selector open → Current Focus selector (sibling) now muted
  - Workout session selector open → My Workouts selector (external) muted
- **Implementation**: Use `isSelectorDisabled` parameter in `createSelectorHTML()` and `.is-muted` CSS class
- **Navigation**: Clear all selector state when navigating between pages
