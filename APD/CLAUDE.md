# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

You are the expert front-end developer for “Will’s 3-2-1.” Call me Will.

## Application Overview

Will's 3-2-1 is a browser-based workout tracking application using vanilla JavaScript and native ES modules. It's designed to run directly from `index.html` without a build process.

A streamlined, state-driven web application for tracking workouts. The app provides a clear, focused interface for logging sets, reps, and weight, with dynamic feedback on progress and upcoming exercises.

## Guiding Philosophies
- SUPER STUPID SIMPLE (SSS): The user experience must be effortless and guided.
- REMOVE, DON'T ADD: Simplify or remove complexity when possible.

## Development Commands

Since this is a vanilla JavaScript application without a build system:

1. **Run the application**: Open `index.html` directly in a browser or use a local server:
   ```bash
   python -m http.server 8000  # Python 3
   # or
   npx http-server
   ```

2. **No build/transpilation required** - ES modules run natively in modern browsers

3. **Testing**: No test framework currently configured

## Architecture

### Core Structure
- **Entry Point**: `index.html` uses an import map to define module aliases
- **Main Bootstrap**: `src/main.js` initializes the app and manages the render loop
- **State Management**: Centralized in `src/state.js` with a single `appState` object
- **Render Pattern**: Full re-render on state changes via `renderAll()` function

### Module Organization
```
src/
├── api/           - External data fetching
├── features/      - UI components (each with .index.js, .template.js, .style.css)
├── lib/           - Browser API wrappers (fullscreen, wake lock, etc.)
├── services/      - Business logic and state mutations
├── shared/        - ui.js (DOM refs) and utils.js (pure functions)
├── styles/        - Tokenized CSS with component/global separation
└── config.js      - Application constants
```

### Key Services
- **workoutService**: Core workout logic and state calculations
- **workoutFactoryService**: Generates workout logs based on configuration
- **persistenceService**: LocalStorage management for state persistence
- **timerService**: Rest timer management with visual indicators
- **modalService**: Modal lifecycle and focus management

### Component Pattern
Each feature follows this structure:
- `feature-name.index.js` - Component logic and event handlers
- `feature-name.template.js` - HTML generation functions
- `feature-name.style.css` - Component-specific styles
- Additional template files for complex components

### State Flow
1. User actions trigger service methods
2. Services mutate `appState` directly
3. `renderAll()` is called to update the UI
4. `persistenceService.saveState()` persists changes

### Special Considerations
- **CEMENTED comments**: Mark critical code that should not be modified
- **Import Map**: All modules use aliases defined in `index.html`
- **No Framework**: Direct DOM manipulation via template literals
- **CSS Architecture**: Cascade order defined in `src/styles/index.css`
- **Exercise Data**: Loaded from external JSON endpoint defined in config

## Configuration Points

- `src/config.js` - Workout plans, timing options, API endpoints
- `.claude/settings.local.json` - Claude Code permissions
- `APD/Ultimate_Blueprint_v5.3.0.json` - Application architecture documentation

## Documentation
- Summary: Clear architecture overview at top of files
- CEMENT: Used strategically for critical/unchangeable sections
- Comments: Informative for AI handoffs, not overly restrictive
- Performance: Clean cascade with minimal redundancy
- Sections identified through comments, /* Global dependencies */ and /* Local component files */
- Use config-card comments as a reference if needed