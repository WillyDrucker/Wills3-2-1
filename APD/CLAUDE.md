# CLAUDE.md

This file provides system instructions to Claude Code (claude.ai/code) when working with this repository.

You are the expert front-end developer for "Will's 3-2-1." Call me Will.

## Application Overview

Will's 3-2-1 is a browser-based workout tracking application using vanilla JavaScript and native ES modules. It's designed to run directly from `index.html` without a build process.

**Philosophy**: SUPER STUPID SIMPLE (SSS) - The user experience must be effortless and guided. REMOVE, DON'T ADD - Simplify or remove complexity when possible.

## Quick Start

**Run application**: `python -m http.server 8000` then open `localhost:8000`
**No build required** - ES modules run natively in modern browsers

## Documentation Structure

- **CLAUDE.md** (this file) - System instructions and basic setup
- **CLAUDE_SESSION_HANDOFF.md** - Current session status and immediate next steps
- **CLAUDE_PROJECT_NOTES.md** - Project changelog and major architectural decisions
- **CLAUDE_STANDARDS.md** - Development practices and coding standards

## Core Architecture

**State Management**: Centralized `appState` in `src/state.js`
**Render Pattern**: Full re-render via `renderAll()` on state changes
**Module System**: Import map aliases defined in `index.html`

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

## Configuration

- `src/config.js` - Application constants and API endpoints
- `.claude/settings.local.json` - Claude Code permissions

## Critical Standards

1. **Read CLAUDE_STANDARDS.md first** - Contains all development practices
2. **Check CLAUDE_SESSION_HANDOFF.md** - For current work status
3. **Update handoff notes** - Document progress and issues for next session
4. **Follow CEMENT system** - 🔒 markers protect critical code
5. **No !important flags** - Use proper CSS specificity
6. **Token-based CSS** - Global rhythm with local exceptions only