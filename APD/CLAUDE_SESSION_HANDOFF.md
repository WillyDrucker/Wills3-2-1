# CLAUDE SESSION HANDOFF

## Purpose

This file contains only critical architectural patterns and current session state needed if a session is interrupted. This is NOT a detailed history (see CLAUDE_PROJECT_NOTES.md for that). Focus on:
- Established architectural patterns that guide future work
- Current session state if work is in progress
- Known issues that affect development

**Documentation Flow**: Anything too detailed for SESSION_HANDOFF should be summarized here with full details provided in CLAUDE_PROJECT_NOTES.md. Anything too big for PROJECT_NOTES can go into CLAUDE_ACTIVE.md as an extension.

**Versioning Policy**: Documentation version numbers MUST match the current Git branch version. Only increment when creating a new branch. See CLAUDE_PROJECT_NOTES.md for full versioning policy.

---

## Current Session State

**Status**: Issue 48 Authentication Redirect Fix & Production Deployment (Claude-v5.6.3) - COMPLETE
- Fixed sign-up confirmation email redirect issue (localhost:3000 → dynamic origin-based redirects)
- Added `emailRedirectTo` to signUp() function in authService.js (lines 31-37)
- User updated Supabase Dashboard configuration (Site URL and Redirect URLs)
- Created `_redirects` file for Netlify SPA routing
- Updated exercise database URL from absolute to relative path (config.js:21)
- Removed 20+ debug console.log statements from production code
- Created comprehensive NETLIFY_DEPLOYMENT_GUIDE.md
- Codebase verified production-ready, ready for deployment to wills321.com and beta.wills321.com

**Previous Session**: Modal Animation System Globalization (Claude-v5.6.1) - COMPLETE
- Global animation system with CSS custom properties implemented
- Number-only animation variant created for immediate color visibility
- Modal stacking visibility improvements completed
- All debugging code removed, CLAUDE_DEV_STANDARDS applied to 18 files

---

## Established Architectural Patterns

### 1. Re-export Wrapper Pattern (Backward Compatibility)
When splitting large files into modules, maintain the original file as a re-export wrapper:
```javascript
// actionHandlers.js - maintains all existing imports
export { initialize, getActionHandlers, getSelectorHandlers }
  from "./actionHandlers.index.js";
```

### 2. Reference Object Pattern (Shared State)
Share mutable state between modules using getter/setter objects:
```javascript
const ignoreNextOutsideClickRef = {
  get value() { return ignoreNextOutsideClick; },
  set value(val) { ignoreNextOutsideClick = val; }
};
```

### 3. Callback Injection Pattern (Event Listeners)
Pass event listener attachment functions to render modules:
```javascript
export function renderConfigHeader(animationFlags, attachClickListener, ref) {
  if (!clickListenerAttached && attachClickListener) {
    attachClickListener();
    clickListenerAttached = true;
  }
}
```

### 4. Sequential Queue Pattern (Race Condition Prevention)
Prevent database race conditions with sequential promise chain:
```javascript
let saveQueue = Promise.resolve();
export async function saveWorkoutToDatabase(workout) {
  return new Promise((resolve) => {
    saveQueue = saveQueue.then(() => performSave(workout).then(resolve));
  });
}
```

### 5. Dependency Injection Pattern (Handler Assembly)
Inject dependencies into handler functions for flexibility:
```javascript
export function getConfigHandlers(coreActions) {
  return {
    toggleConfigHeader: () => { /* uses coreActions */ }
  };
}
```

### 6. Workout Commitment Tracking Pattern
Mark workouts as committed when reaching milestones to enable editing:
```javascript
// Trigger points:
// 1. Workout completion (automatic via workoutStateService.js)
// 2. Begin Another Workout (via confirmNewWorkout handler)
// 3. Save My Data + Reset (via saveMyDataAndReset handler)

export function markCurrentWorkoutCommitted() {
  const workout = user.history.workouts.find((w) => w.id === session.id);
  if (workout && !workout.isCommitted) {
    workout.isCommitted = true;
    persistenceService.saveState();
    saveWorkoutToDatabase(workout); // Database sync
  }
}
```

### 7. CSS Cascade Order Pattern (My Data Spacing)
**Critical**: `my-data.history-spacing.css` loads AFTER `my-data.dividers.css` in the import chain. Any spacing overrides for dividers MUST be placed in history-spacing.css, not dividers.css, or they will be overridden.

```css
/* In my-data.style.css - Import order determines cascade */
@import url("./my-data.dividers.css");        /* Loads first */
@import url("./my-data.history-spacing.css"); /* Loads second - wins conflicts */
```

**Pattern**: When adding spacing fixes for My Data calendar elements, check history-spacing.css first. Rules there override dividers.css due to load order.

### 8. Cascade Deletion Pattern (Historical Logs)
Smart deletion that removes entire workout when last log is deleted:
```javascript
export function deleteHistoricalLog(workoutId, setNumber, supersetSide) {
  const workout = user.history.workouts[workoutIndex];
  workout.logs = workout.logs.filter(/* remove specific log */);

  const isLastLog = workout.logs.length === 0;

  if (isLastLog) {
    user.history.workouts.splice(workoutIndex, 1); // Remove entire workout
    deleteWorkoutFromDatabase(workoutId); // Database cascade delete
  } else {
    saveWorkoutToDatabase(workout); // Save updated workout
  }

  return isLastLog; // Signal if workout was deleted
}
```

### 9. Fast Re-render Pattern (UI-Only Updates)
Separate template re-render from database reload for instant interactions:
```javascript
export function refreshMyDataPageDisplay() {
  // Re-render template WITHOUT reloading from database (fast, for selector interactions)
  ui.mainContent.innerHTML = getMyDataPageTemplate();
  // ... wire up event listeners ...
}

export async function renderMyDataPage() {
  // Load workout history from database (slow, for initial load and data refresh)
  if (appState.auth?.isAuthenticated) {
    const { workouts } = await loadWorkoutsFromDatabase();
    appState.user.history.workouts = workouts;
  }
  refreshMyDataPageDisplay(); // Then render template
}
```

**Use Cases**:
- Opening/closing selectors without data changes
- UI state toggles (active/muted states)
- Any interaction that doesn't modify appState data

### 10. Options-List Overlay Pattern (Absolute Positioning)
Pattern for overlaying content without pushing page layout:
```css
.overlay-container {
  position: absolute;
  /* NO 'top' property - stays at natural position but out of document flow */
  left: 0;
  right: 0;
  width: 100%; /* Full width of parent */
  z-index: 200; /* Above all content */
}
```

**Key Points**:
- `position: absolute` removes from document flow (no layout push)
- Omitting `top` property keeps natural vertical position
- `z-index: 200` ensures overlay above content below
- Parent needs `position: relative` for positioning context

**Examples**: `.options-list` in selectors, `.history-edit-buttons` in My Data

### 11. Modal Animation System (Global + Number Variant)
Global animation system using CSS custom properties for reusable modal animations:
```css
/* Global animation definition */
@keyframes modal-text-grow-flash {
  0% { color: var(--text-primary); transform: scale(1); }
  60% { color: var(--text-primary); transform: scale(1.15); }
  66.7% { color: var(--text-primary); transform: scale(1); }
  72.2% { color: var(--animation-flash-color); text-shadow: 0 0 8px var(--animation-flash-color); }
  85% { color: var(--animation-flash-color); text-shadow: none; }
  100% { color: var(--animation-flash-color); }
}

/* Each modal sets its color */
.delete-log-card {
  --animation-flash-color: var(--text-red-skip);
}
.new-workout-card {
  --animation-flash-color: var(--text-green-plan);
}
```

**Number-Only Variant**: For number animations (change count, logged sets count), use `modal-number-grow-flash` which starts colored instead of white:
```css
@keyframes modal-number-grow-flash {
  0% { color: var(--animation-flash-color); transform: scale(1); }
  60% { color: var(--animation-flash-color); transform: scale(1.15); }
  /* ... same timing, stays colored throughout ... */
}
```

**Use Cases**:
- Full-text warnings: `.modal-text-animated` (white → color transition)
- Number-only: `.modal-number-animated` (immediate color, better visibility during grow)

**Display Rules**:
- Spans need `display: inline-block` for transforms to work
- Paragraphs need `display: block` to maintain `text-align: center`

---

## Known Issues

### DevTools Mobile Mode Performance Lag (~200ms)

**Issue**: When Chrome DevTools reopens with mobile mode already active (state restoration), first user interaction has ~200ms delay. Does NOT occur when manually switching to mobile mode (Ctrl+Shift+M).

**Root Cause**: Chrome defers layout recalculation when restoring mobile mode from saved state. First interaction triggers deferred work.

**Attempted Fixes** (All unsuccessful):
1. CSS containment (`contain: style`) - No improvement
2. Event listener initialization order - No improvement
3. Force layout completion (`document.body.offsetHeight`) - No improvement
4. Resize event handler - No improvement

**Impact**: DevTools only - does NOT affect real mobile devices

**Decision**: Documented as known DevTools-specific issue, not blocking release

**Files with documentation**:
- `src/main.js:192-219` - Comprehensive issue documentation
- `src/styles/base/_scaffolding.css:38,50` - CSS containment comments
- `src/styles/components/_modals.css:57` - CSS containment comments

---

## File Organization Guidelines

### When to Split Files
- Files >150 lines (except cohesive units)
- Multiple distinct responsibilities
- Logical separation exists

### Cohesive Units (Keep Together)
Files kept together despite >150 lines due to high cohesion:
- `login-page.handlers.resetpassword.js` (254 lines) - Rate limiting complexity
- `actionHandlers.modals.js` (300 lines) - 6 modal types with shared patterns
- `workoutSyncService.delete.js` (153 lines) - Admin functions + foreign key logic
- `profile-page.handlers.password.js` (182 lines) - Password change with verification
- `config-card.header.render.js` (219 lines) - All renders + Quick Button animations
- `config-card.header.style.quickbuttons.css` (217 lines) - 3 buttons with animations

**Rationale**: Splitting these would harm readability. Each represents a single, complex responsibility.

---

## Critical Code Patterns

### State Flow
```
Action → Service → appState → renderAll() → persistenceService.saveState()
```

### Animation Performance
- GPU-accelerated with `will-change`
- NO `!important` in keyframes
- textContent updates (not innerHTML) preserve animations

### Component Pattern
```
feature.index.js    - Logic and coordination
feature.template.js - HTML generation
feature.style.css   - Styling
```

### CSS Containment
**Changed from** `contain: layout style` **to** `contain: style`
- `contain: layout` creates isolated stacking contexts
- Prevents z-index from working across elements
- `contain: style` isolates style recalculations only

**Files affected**:
- `src/styles/base/_scaffolding.css` - `.app-container`, `.card`
- `src/styles/components/_modals.css` - Modal containers
