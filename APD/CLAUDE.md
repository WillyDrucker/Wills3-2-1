# CLAUDE.md

## Purpose

This file serves as the primary memory source for Claude Code when working with this repository. It contains essential application context, architecture overview, and workflow instructions that must be committed to memory at the start of each session.

## Read Order

When starting a session, read these files in order:

1. **CLAUDE.md** - Commit to memory (core application context)
2. **CLAUDE_DEV_STANDARDS.md** - Commit to memory (development standards)
3. **CLAUDE_SESSION_HANDOFF.md** - Manage memory as needed (current session state)
4. **CLAUDE_PROJECT_NOTES.md** - Manage memory as needed (project history)
5. **CLAUDE_ACTIVE.md** - Manage memory as needed (temporary working notes)

---

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
**Standards**: Read `CLAUDE_DEV_STANDARDS.md` first (4 development practices + session handoff)
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

## Default Spacing Rhythm

**CRITICAL**: This is the DEFAULT rhythm only. DO NOT apply these values where customizations already exist (customizations exist throughout the application).

**Base Spacing**:
- All elements: 16px visual spacing from other elements
- Text lines: 7px apart
- Labels: 7px from their associated element
- Card margins: 10px left and right (from viewport edges)
- Card internal margins: 16px

**Override Policy**: These defaults can be overridden as needed for specific components. When resuming work or reapplying standards, check existing spacing before applying defaults to avoid unintended global changes.

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
