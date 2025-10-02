# WILL'S 3-2-1 PROJECT NOTES

**Project**: Will's 3-2-1 Workout Tracking Application
**Tech Stack**: Vanilla JavaScript, ES Modules, CSS Tokens
**Philosophy**: SUPER STUPID SIMPLE (SSS), REMOVE DON'T ADD

## VERSION CHANGELOG

### **v6.20 - Config-Header Dropdown Redesign**
**Date**: 2025-10-01
**Problem**: Config-header needed complete UX redesign as giant selector dropdown instead of expand/collapse card, with proper spacing, alignment, and interaction behavior
**Solution**: Transformed config-header into dropdown selector overlay with flexible icon bar buttons and stacked dual-mode text display
**Key Achievements**:
- **Dropdown overlay design**: Config-header dropdown overlays on top of active-exercise card instead of pushing down
- **Icon bar redesign**: Plan (flex 1) | Bodypart (50px) | Session (flex 1) | Dropdown removed
- **Reset button removed**: Reset functionality moved to dropdown footer buttons
- **Session button extended**: Shows "37 Mins" format with colored number matching session type
- **Dual-mode stacking**: Plan Quick Button shows stacked bodyparts (Superset) or names (Partner) with 6px gap
- **Cancel/Reset buttons**: Footer buttons at bottom of dropdown with 16px spacing between
- **Seamless connection**: Blue border throughout, squared corners at transition, matching backgrounds
- **No layout shift**: Dropdown opens/closes without moving active-exercise card (absolute positioning)
- **Session cycling preserved**: Chevrons work on first click, dropdown stays open during cycling
- **Body part removed**: Removed workout focus (push/pull) from active-exercise card header completely
**Technical Architecture**:
- Dropdown uses absolute positioning with `top: 100%` to overlay below card
- Icon bar buttons use `flex: 1` for Plan and Session, fixed `50px` for Bodypart
- Blue border always visible (not transparent), squared bottom corners when expanded
- Margin compensation (`calc(var(--space-m) - 2px)`) prevents 2px shift on expand
- Expanded content padding: 16px bottom to achieve proper spacing accounting for border
- Click-outside handler with `setTimeout(() => ignoreNextOutsideClick = false, 0)` prevents double-click
- Session cycling uses `renderSessionDisplay()` to update both icon bar and expanded text without re-render
**Files Modified**:
- `config-header.template.js` - Removed reset button, extended session button, stacked dual-mode text, wrapped expanded content
- `config-header.style.css` - Absolute positioning for dropdown, flexible icon bar widths, spacing fixes, blue border always visible
- `config-header.index.js` - Click-outside handler improvements, setTimeout for flag clearing, renderSessionDisplay updates icon bar
- `active-exercise-card.templates.workoutCard.js` - Removed workout focus HTML generation completely
- `active-exercise-card.index.js` - Removed workout focus code from renderActiveCardHeader
- `main.js` - Removed renderConfigHeader call from updateActiveWorkoutPreservingLogs to preserve dropdown state
**Spacing Fixes**:
- Current Setup: 13px padding top + 2px border = 16px visual
- Current Plan: -1px margin top = 16px visual from icon bar
- Current Focus: 13px margin top = 16px visual from above selector
- Bottom buttons: 16px padding bottom + 16px gap between buttons
**Bug Fixes**:
- Partner mode action name corrected: `openPartnerModal` → `openPartnerMode`
- Bodypart reappearing after clock updates - completely removed from active card header
- Double-click issue on session chevrons - setTimeout clears ignore flag after render
- Dropdown closing on session cycle - removed renderConfigHeader from update function
- 2px layout shift on expand - added margin-bottom compensation
**Technical Discoveries**:
- Absolute positioned dropdown requires careful border/margin math to prevent shifts
- Click-outside handler must ignore clicks on buttons/selectors inside card
- setTimeout with 0 delay queues flag clearing for next event loop tick
- Always-visible blue border prevents 2px shift from transparent→blue transition
- Flexible icon bar buttons (`flex: 1`) adapt to available space dynamically
**Status**: COMPLETE - Config-header dropdown working with proper spacing, no layout shifts, session cycling functional

### **v6.19 - Config-Header Refinement & Config-Modal Removal** (SUPERSEDED BY v6.20)
**Date**: 2025-10-01
**Status**: This version was partially implemented then redesigned into v6.20 dropdown approach
**Original Goals**: Icon bar reorganization, muscle group icons, plan abbreviation, config-modal removal
**What Survived**: Config-modal business logic preservation, muscle group icon system concept
**What Changed**: Complete UX redesign from expand/collapse to dropdown overlay

### **v6.18 - Collapsible Config-Header Complete**
**Date**: 2025-09-30
**Problem**: Config-header consuming too much vertical space, forcing active-exercise card and workout logs below the fold requiring constant scrolling
**Solution**: Implemented collapsible config-header with minimal icon bar (collapsed state) and full controls (expanded state)
**Key Achievements**:
- **Collapsed state (default)**: Minimal icon bar with plan/session/time status + expand button
- **Icon bar design**: 📋 Plan | 🎯⚡🔧 Session | ⏱️ Time | 🔄 Reset | [▼] Expand
- **Expanded state**: Full selector + session cycling chevrons (all original functionality)
- **Space savings**: ~60-70px vertical space saved when collapsed
- **User flow improvement**: Active card and logs visible without scrolling
- **State persistence**: Collapsed/expanded preference saved across sessions
**Technical Architecture**:
- `appState.ui.isConfigHeaderExpanded` - Controls collapsed/expanded state
- `getCollapsedTemplate()` - Minimal icon bar with status display
- `getExpandedTemplate()` - Full controls (preserved original functionality)
- `toggleConfigHeader` action - Toggles state and triggers full re-render
**Icon Bar Components**:
- **Plan icon** (📋): Shows current plan summary (12-Week/8-Week or Superset/Partner)
- **Session icon** (🎯/⚡/🔧): Dynamic icon based on Standard/Express/Maintenance
- **Time badge** (⏱️): Shows workout duration (e.g., "48 Mins")
- **Reset button** (🔄): Quick access to reset confirmation
- **Expand button** ([▼]): Opens full config controls
**Files Modified**:
- `src/state.js` - Added isConfigHeaderExpanded state field
- `src/services/persistenceService.js` - Added isConfigHeaderExpanded to persisted state
- `src/services/actionService.js` - Added toggleConfigHeader action
- `src/features/config-header/config-header.template.js` - Split into collapsed/expanded templates
- `src/features/config-header/config-header.style.css` - Added icon bar CSS, collapse/expand transitions
**Technical Discoveries**:
- Icon bar uses flexbox with gap for responsive layout
- Emoji icons (📋🎯⚡🔧⏱️🔄) provide intuitive visual status at a glance
- Collapse button positioned absolutely in header (right: 80px before clock)
- CSS transitions on card-content-container padding for smooth state changes
- Responsive design: Icon bar wraps on narrow screens (<480px)
**Status**: COMPLETE - Collapsible config-header saving significant vertical space, collapsed by default

### **v6.17 - Session Cycling Implementation Complete**
**Date**: 2025-09-30
**Problem**: Need ability to cycle between Standard/Express/Maintenance sessions without losing logged exercise data, plus animations were resetting on session changes, plus time not updating on session change
**Solution**: Implemented session cycling control with chevron buttons, validation system, set preservation logic, animation-safe rendering, and time recalculation
**Key Achievements**:
- **Session cycling control**: Chevron buttons below "Current Setup" selector to cycle Standard/Express/Maintenance
- **Validation system**: Prevents cycling to sessions that would remove logged sets
- **Set preservation**: Merge logic keeps logged sets when changing sessions
- **Animation preservation**: textContent updates instead of innerHTML prevents animation restarts
- **Express validation fix**: Check by exercise name instead of set number (accounts for renumbering)
- **Time recalculation fix**: Added workoutService.updateWorkoutTimeRemaining() call on session change
- **Terminology update**: Changed "Recommended:" to "Standard:" throughout UI
**Technical Architecture**:
- Created `src/utils/sessionValidation.js` - shared validation logic (removed duplicates from 5 files)
- `canCycleToSession()` - validates if session change would remove logged sets
- `updateWorkoutLogForSessionChange()` - merges logged sets with new session structure
- `renderSessionDisplay()` - animation-safe updates using textContent/className (no innerHTML)
**Critical Bug Fixes**:
1. **Express validation** - Was comparing set numbers to rules, but log was renumbered. Fixed to check by exercise name.
2. **Animation reset** - innerHTML updates restart ALL CSS animations. Fixed using textContent/className properties.
3. **Initialization chain** - Added `updateActiveWorkoutPreservingLogs` to dependency chain
**Files Created**:
- `src/utils/sessionValidation.js` - Shared validation utility
**Files Modified**:
- `src/main.js` - Added updateActiveWorkoutPreservingLogs() function + workoutService.updateWorkoutTimeRemaining() call
- `src/services/appInitializerService.js` - Pass preservation function through initialization
- `src/services/actionService.js` - Chevron actions use preservation logic
- `src/services/workoutFactoryService.js` - Added updateWorkoutLogForSessionChange() merge function
- `src/features/config-header/config-header.index.js` - Added renderSessionDisplay() with textContent updates
- `src/features/config-header/config-header.template.js` - Use shared validation utility
- `src/features/config-card/config-card.templates.timeSelector.js` - Use shared validation utility
- `src/features/config-modal/config-modal.templates.timeSelector.js` - Use shared validation utility
- `src/config.js` - Changed "Recommended:" to "Standard:"
- `index.html` - Added "utils/" to import map
**Technical Discoveries**:
- innerHTML updates ANYWHERE restart ALL CSS animations in document
- Express/Maintenance filtering changes set positions via renumbering - validation must check by exercise name
- Session cycling control = `.current-session-display` with chevron buttons and session text
- Merge pattern: Keep logged sets that exist in new session + add new pending sets + renumber
- Time recalculation must be called explicitly after session change to reflect new set counts
**Status**: COMPLETE - Session cycling working with validation, preservation, animation stability, and proper time updates

## CRITICAL DISCOVERIES

### **PNG Transparency Export (v6.19)**
When exporting PNG with transparency in GIMP, must uncheck "Save background color" option to get true transparency. File location matters - icons at root `/icons/` not `/public/icons/` for proper serving.

### **textContent vs innerHTML for Updates (v6.19)**
Using `textContent` to update elements preserves focus state and doesn't restart CSS animations. Using `innerHTML` recreates DOM elements causing focus loss and animation restarts.

### **CSS :has() Selector Power (v6.19)**
`:has()` pseudo-class enables parent styling based on child state. Example: `#config-header:has(.config-header-group.expanded)` applies blue border when dropdown is expanded.

### **Scroll Service Viewport Awareness (v6.19)**
Selectors should only trigger scroll if their menu would overflow the viewport. Check `getBoundingClientRect().bottom > window.innerHeight` before scrolling.

### **Global CSS Reset Constraint (v5.3.6)**
Found that `* { margin: 0; padding: 0; }` combined with component-level !important declarations prevents normal margin control, requiring architectural workarounds.

### **CSS Table Layout Stability (v6.2)**
CSS Grid's content-based column balancing causes positioning instability. CSS table with `table-layout: fixed` provides content-independent equal columns, eliminating layout shifts.

### **CSS Import Order Dependencies (v5.3.5)**
Import sequence in main style files affects cascade specificity, requiring careful ordering and exclusion selectors for dual-mode patterns.

### **CEMENT System Established (v5.3.2)**
Implemented 🔒 markers to protect critical architectural decisions that solve specific bugs or timing issues.
