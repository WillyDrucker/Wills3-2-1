# CLAUDE.md

This file provides system instructions to Claude Code (claude.ai/code) when working with this repository.

You are the expert front-end developer for "Will's 3-2-1." Call me Will.

## Application Overview

Will's 3-2-1 is a browser-based workout tracking application using vanilla JavaScript and native ES modules. It's designed to run directly from `index.html` without a build process.

**Philosophy**: SUPER STUPID SIMPLE (SSS) - The user experience must be effortless and guided. REMOVE, DON'T ADD - Simplify or remove complexity when possible.

**UI/UX Rules**:
- **NO HOVER EFFECTS**: Zero mouse-over effects. Touch-first design.
- **NO MOUSE EVENTS**: Use click, pointerdown, or touch events only.
- **NO TRANSITIONS/DELAYS**: All UI changes immediate. Big, thick, bold, instant.
- **NO SETTIMEOUT HACKS**: Find proper event/architectural solutions.

## Quick Reference

**Run**: `python -m http.server 8000` → `localhost:8000`
**Standards**: Read `CLAUDE_STANDARDS.md` first (4 development practices + session handoff)
**NO VERSION NUMBERS**: Never in file headers. Git tracks versions.

## Architecture

**State**: Centralized `appState` in `src/state.js`
**Render**: Full re-render via `renderAll()` on state changes
**Flow**: Action → Service → `appState` → `renderAll()` → `persistenceService.saveState()`
**Modules**: Import map aliases in `index.html`

**Structure**:
```
src/
├── features/      - UI components (.index.js, .template.js, .style.css)
├── services/      - Business logic and state mutations
├── styles/        - Tokenized CSS system (global-first, 16px rhythm)
└── shared/        - DOM refs (ui.js) and utilities
```

## GitHub Workflow

**Issue Creation**: Concise (2-3 sentences), high-level acceptance criteria only, no code diffs.
**Issue Updates**: After fix confirmed, add minimal solution summary + code diff (file + line numbers).
**Issue Closure**: Wait for user confirmation before closing.
**Issue Types**: Bug (critical issues), Feature (new functionality), Task (refactoring/docs/standards).

## Notification System

**Beep Notifications**: Claude plays notification beep to signal completion of planning or implementation phases for multi-project workflow management.

**Beep Command**: `powershell -Command "[System.Console]::Beep(800, 500)"`
- 800Hz frequency, 500ms duration
- Uses PC speaker at system volume (cannot be programmatically adjusted)

**When Used**:
- End of planning mode (last checklist item before ExitPlanMode)
- End of implementation (last solution checklist item completed)

**Status**: PERMANENT FEATURE - Always use beep notifications for workflow completion signals

---

## Recent Session Notes

### AI Performance Refactoring - Phase 1-4 Complete (2025-01-21)

**Mission**: Break all files >150 lines into modular, AI-performant files while maintaining 100% backward compatibility.

**Results**:
- **6 large files → 31 modular files** (584 lines → 7 files average)
- **39 files changed**: 3,463 insertions(+), 2,396 deletions(-)
- **21 files** received complete CLAUDE standards headers
- **100% compliance**: All 207 files now have proper Dependencies + Used by sections
- **No version numbers**: Removed 11 references from 8 files
- **!important audit**: 107/113 flags architecturally justified (95%)

**Files Refactored**:
1. `login-page.index.js` (584 → 7 files): Auth handlers split by flow
2. `actionHandlers.js` (572 → 8 files): Navigation/config/selectors/modals separated
3. `workoutSyncService.js` (430 → 5 files): Save/load/delete/migrate isolated
4. `profile-page.index.js` (263 → 3 files): Nickname/password handlers split
5. `config-card.header.index.js` (399 → 5 files): Cancel/session/handlers/render modules
6. `config-card.header.style.css` (295 → 3 files): Base/quickbuttons/expanded split

**Key Patterns**:
- Re-export wrappers maintain backward compatibility
- Reference objects share state between modules
- Callback injection passes event listeners
- Save queue pattern prevents race conditions

**All functionality verified**: Syntax validation passed, code review confirmed animations and database sync intact.

See `CLAUDE_STANDARDS.md` RECENT SESSIONS for detailed technical documentation.

---

### v6.24 - Quick Button Animations & Standards (2025-01-21)

**Key Implementations**:
1. Quick Button grow animations on "Let's Go!" confirmation (Plan/Focus/Session)
2. "Let's Go!" pulse on session changes (smart non-interruption)
3. Single-click Cancel with proper state restoration
4. Backdrop click blocking to prevent accidental interactions

**Standards Applied**: All modified files updated with comprehensive headers, global animations moved to `_animations-general.css`, no `!important` flags, semantic naming throughout.

**Critical Fix**: Cancel now properly restores session state, workout cards, and preserves ongoing animations. Session time restoration requires `updateWorkoutTimeRemaining()` call.
