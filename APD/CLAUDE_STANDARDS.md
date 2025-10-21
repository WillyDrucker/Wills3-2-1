# CLAUDE DEVELOPMENT STANDARDS & SESSION HANDOFF

## CORE PHILOSOPHY
- **SUPER STUPID SIMPLE (SSS)**: Remove complexity, avoid feature creep
- **REMOVE DON'T ADD**: Simplify existing before adding new
- **Touch-first design**: No hover, no mouse events, immediate UI responses

## 4 ACTIVE DEVELOPMENT STANDARDS

### 1. SESSION HANDOFF DOCUMENTATION
Document key changes and handoff notes at bottom of this file in RECENT SESSIONS section.

### 2. CSS SPECIFICITY OVER !IMPORTANT
Use proper CSS cascade: `.component.state-class`, three-class specificity, `:has()`, ID selectors where appropriate.

### 3. TOKEN-BASED CSS SYSTEM
Global-first with 16px rhythm: `var(--space-m)`, `var(--color-primary)`. Local exceptions documented inline.

### 4. SEMANTIC NAMING CONVENTION
Purpose-driven classes: `.action-button.button-danger` not `.red-button`. Update as architecture evolves.

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

---

## RECENT SESSIONS

### Session: v6.24 - Quick Button Animations & Standards Compliance (2025-01-21)

**Implemented Features**:
1. **Quick Button Grow Animations on Config Confirmation**
   - Animated Plan/Focus/Session Quick Buttons based on what changed
   - Triggers only on "Let's Go!" (never on Cancel)
   - Simultaneous animations for multiple changes
   - 600ms snappy grow-snap (80% grow/20% snap back)

2. **"Let's Go!" Button Pulse on Session Changes**
   - Session cycling/selection now triggers pulse animation
   - Smart non-interruption: won't restart if already pulsing
   - Applies to cycleNextSession, cyclePreviousSession, handleTimeSelection

3. **Config Cancel/Close Fixes**
   - Cancel button works with single click
   - Click-outside properly cancels and closes
   - Backdrop blocks accidental clicks (pointer-events: auto)
   - State restoration preserves workout cards and animations
   - Session selector correctly restores on cancel

**Standards Applied**:
- Moved `selector-grow-snap` and `quick-button-grow-snap` to global `_animations-general.css`
- Updated all modified files with comprehensive headers and documentation
- No `!important` flags introduced
- Semantic class naming: `is-animating-quick-button`
- Token-based CSS maintained throughout

**Files Modified**:
- `src/styles/utils/_animations-general.css` - Added global grow-snap animations
- `src/features/config-card/config-card.header.style.css` - Quick Button animation class
- `src/features/config-card/config-card.header.expanded.css` - Backdrop click blocking
- `src/features/config-card/config-card.header.index.js` - Animation triggers, cancel fixes
- `src/services/actions/actionHandlers.js` - Change detection, pulse triggers, session restoration

**Technical Discoveries**:
- Change detection via snapshot comparison enables targeted UI feedback
- `requestAnimationFrame` + 600ms setTimeout ensures smooth animation cleanup
- Config header lock flags prevent premature collapse during operations
- Session time restoration requires `updateWorkoutTimeRemaining()` call
- Workout card re-render on cancel requires explicit `renderActiveExerciseCard()/renderWorkoutLog()` calls

**Architecture Patterns**:
- Animation flags passed through render chain (toggleConfigHeader → renderConfigHeader)
- Simultaneous button animations via parallel class application
- Non-interrupting pulse via `is-pulsing-action` class check
- Global animations centralized for reusability across modals and components
