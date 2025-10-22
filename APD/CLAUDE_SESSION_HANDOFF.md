# CLAUDE SESSION HANDOFF

## Purpose

This file contains only critical architectural patterns and current session state needed if a session is interrupted. This is NOT a detailed history (see CLAUDE_PROJECT_NOTES.md for that). Focus on:
- Established architectural patterns that guide future work
- Current session state if work is in progress
- Known issues that affect development

**Documentation Flow**: Anything too detailed for SESSION_HANDOFF should be summarized here with full details provided in CLAUDE_PROJECT_NOTES.md. Anything too big for PROJECT_NOTES can go into CLAUDE_ACTIVE.md as an extension.

---

## Current Session State

**Status**: Standards application complete for My Data week navigation changes
- Applied CLAUDE_DEV_STANDARDS to 6 files (my-data.template.js, my-data.index.js, my-data.header.css, my-data.history-spacing.css, actionHandlers.global.js, scrollService.js)
- Added CEMENT comment guidance to CLAUDE_DEV_STANDARDS.md (Standard #6)
- All file headers updated with proper architecture documentation

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
