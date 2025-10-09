# CLAUDE.md

This file provides system instructions to Claude Code (claude.ai/code) when working with this repository.

You are the expert front-end developer for "Will's 3-2-1." Call me Will.

## Application Overview

Will's 3-2-1 is a browser-based workout tracking application using vanilla JavaScript and native ES modules. It's designed to run directly from `index.html` without a build process.

**Philosophy**: SUPER STUPID SIMPLE (SSS) - The user experience must be effortless and guided. REMOVE, DON'T ADD - Simplify or remove complexity when possible.

**UI/UX Rules**:
- **NO HOVER EFFECTS**: Zero mouse-over effects anywhere in the application. Touch-first design.
- **NO TRANSITIONS/DELAYS**: All UI changes must be immediate. No CSS transitions or animation delays. This is a workout app - everything must be big, thick, bold, and instant for performance.

## Quick Start

**Run application**: `python -m http.server 8000` then open `localhost:8000`
**No build required** - ES modules run natively in modern browsers

## Core Architecture

**State Management**: Centralized `appState` in `src/state.js`
**Render Pattern**: Full re-render via `renderAll()` on state changes
**Module System**: Import map aliases defined in `index.html`

## Critical Standards

1. **Read CLAUDE_STANDARDS.md first** - Contains all 5 development practices
2. **Check CLAUDE_SESSION_HANDOFF.md** - For current work status and session changes
3. **Review CLAUDE_PROJECT_NOTES.md** - For version history and critical discoveries

## Project Files Reference

**Configuration**:
- `src/config.js` - Application constants and API endpoints
- `.claude/settings.local.json` - Claude Code permissions

**File Structure**:
```
src/
├── features/      - UI components (.index.js, .template.js, .style.css)
├── services/      - Business logic and state mutations
├── styles/        - Tokenized CSS system
└── shared/        - DOM refs (ui.js) and utilities
```

**Component Pattern**: Each feature has index.js (logic), template.js (HTML), style.css (styles)

**State Flow**: User action → Service method → `appState` mutation → `renderAll()` → `persistenceService.saveState()`

## GitHub Issue Tracking

**Issue Creation** (Keep lean):
- Concise descriptions (2-3 sentences max)
- High-level acceptance criteria only
- No code diffs during creation

**Issue Types**:
- **Bug**: Critical bugs, broken functionality
- **Feature**: New features or enhancements
- **Task**: Refactoring, documentation, standards application

**Issue Updates** (After fix confirmed):
- Add minimal solution summary
- Add code diff highlighting the fix (file + line numbers)
- **DO NOT** show iterative code changes - repository tracks that
- If issue snowballs, add more depth but stay lean

**Issue Closure**:
- **DO NOT close** until user explicitly confirms
- User tests and verifies before closing
- Include issue number in commit messages

## Notification System

**Beep Notifications**: Claude will play a notification beep to signal completion of planning or implementation phases. This helps with multi-project workflow management.

**Beep Command**: `powershell -Command "[System.Console]::Beep(800, 500)"` - 800Hz frequency, 500ms duration

**Volume Note**: Windows Console.Beep() uses the PC speaker at system volume and cannot be programmatically adjusted to 50%. Volume is controlled by system settings only.

**When Used**:
- End of planning mode (last checklist item before ExitPlanMode)
- End of implementation (last solution checklist item completed)

**Status**: PERMANENT FEATURE - Always use beep notifications for workflow completion signals