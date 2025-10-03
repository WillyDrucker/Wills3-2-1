# WILL'S 3-2-1 PROJECT NOTES

**Project**: Will's 3-2-1 Workout Tracking Application
**Tech Stack**: Vanilla JavaScript, ES Modules, CSS Tokens
**Philosophy**: SUPER STUPID SIMPLE (SSS), REMOVE DON'T ADD

## VERSION CHANGELOG

### **v6.23 - Config Dropdown & Selector Muting Improvements**
**Date**: 2025-10-03
**Problem**: Config dropdown closing on Superset/Partner confirmation, one-selector-to-rule-them-all not fully enforced, selector muting inconsistent
**Solution**: Fixed unlock timing with setTimeout, implemented bidirectional selector blocking, enhanced visual muting consistency
**Key Achievements**:
- **Modal confirmation fix**: Config dropdown stays open when confirming Superset/Partner modes (setTimeout unlock after re-render)
- **Bidirectional selector blocking**: Config dropdown blocks external selectors AND external selectors block config dropdown
- **Visual muting consistency**: Exercise selector always fully muted when other selectors open, config border mutes to dark blue
- **One-selector enforcement**: Implemented complete mutual exclusivity between config dropdown and all external selectors
**Root Causes Identified**:
- **Dropdown closing on confirm**: Unlock was happening before re-render completed, click-outside was firing
- **Incomplete blocking**: Only prevented config→external, not external→config
- **Visual inconsistency**: Exercise selector had special opacity rules that weren't overridden when other selectors opened
**Technical Architecture**:
- Confirm flow: handleConfirm() → updateActiveWorkoutAndLog() → setTimeout(0) → unlock (ensures all renders complete)
- Bidirectional blocking: selectorService.toggle() checks both directions (config→external, external→config)
- Visual muting: CSS !important rules force exercise selector muting regardless of .is-muted class state
- Config border muting: `body.is-selector-open #config-header:not(:has(details[open]))` dims border when external selector open
**Files Modified**:
- `src/services/actionService.js` - setTimeout unlock in confirmSuperset/confirmPartnerWorkout, bidirectional blocking in toggleConfigHeader
- `src/services/selectorService.js` - Added config dropdown check to prevent external selector opening
- `src/features/config-header/config-header.style.css` - Border muting when external selector open
- `src/features/active-exercise-card/active-exercise-card.selector.css` - Forced muting rules with !important
**Technical Discoveries**:
- setTimeout(0) critical for ensuring unlock happens after ALL render cycles complete
- Bidirectional blocking requires checks in both directions (toggle handler AND action handler)
- CSS !important necessary to override special-case opacity rules for exercise selector
- Visual muting state independent of business logic muting (.is-muted class)
**Status**: IN PROGRESS - Core functionality complete, additional selector muting edge cases identified for next session

### **v6.22 - Config Dropdown Persistence & Dynamic Icons**
**Date**: 2025-10-03
**Problem**: Config dropdown closes when selecting items from "Current Focus" selector, Focus Quick Button needs dynamic icons for dual modes
**Solution**: Fixed event bubbling issue with stopPropagation, added dynamic muscle group icons, enhanced button styling
**Key Achievements**:
- **Config dropdown persistence**: Fixed dropdown closing on day/plan/exercise swap selections using event.stopPropagation()
- **Dynamic Focus icons**: Muscle group icons update based on current/next exercise in Superset/Partner modes
- **Button styling**: Cancel button (solid gray) and Reset Settings button (solid red with black text)
- **Reset menu cleanup**: Removed "Reset Settings - Clear Logs" from selector, kept Reset Settings button
- **Modal state preservation**: Config dropdown stays open when Superset/Partner modes are confirmed or cancelled
- **Dual-mode clear bug**: Fixed exercise duplication when clearing logged sets in dual modes
- **Hamburger menu z-index**: Fixed config card not muting when side nav opens
**Root Causes Identified**:
- **Dropdown closing**: Click event was bubbling to document-level `handleClickOutside()` after list item handler completed and unlocked
- **Exercise duplication**: `resetExerciseForMuscleGroup()` wasn't respecting `supersetSide` parameter, replaced exercises across both sides
- **Modal closing dropdown**: No state restoration on modal confirm/cancel
**Technical Architecture**:
- Event flow: List item click → handler runs → selector closes → unlock → event.stopPropagation() prevents bubbling to handleClickOutside()
- Lock mechanism: `configHeaderLocked` flag prevents click-outside from closing during operations
- State restoration: `wasConfigHeaderExpandedBeforeModal` tracks state before opening Superset/Partner modals
- Dynamic icons: `renderFocusDisplay()` updates icon based on `currentLogIndex` or next pending exercise in dual modes
- Muscle group icons: PNG images at `/icons/muscle-groups/` (arms, chest, back, legs, shoulders)
**Files Modified**:
- `src/services/actionService.js` - Added event.stopPropagation() in list item handler, modal state tracking, extensive debug logging
- `src/services/workoutService.js` - Fixed resetExerciseForMuscleGroup() to respect supersetSide parameter
- `src/services/selectorService.js` - Added closeAllExceptConfigHeader() function
- `src/features/config-header/config-header.index.js` - Added renderFocusDisplay(), configHeaderLocked checks, notifyConfigHeaderToggled()
- `src/features/config-header/config-header.template.js` - Updated getMuscleGroupIcon() for dual-mode dynamic icons, removed Reset menu item
- `src/features/config-header/config-header.style.css` - Button styling (Cancel: gray/white, Reset: red/black)
- `src/features/workout-log/workout-log.index.js` - Pass supersetSide to resetExerciseForMuscleGroup()
- `src/features/superset-modal/superset-modal.index.js` - State restoration before modalService.close()
- `src/features/partner-modal/partner-modal.index.js` - State restoration before modalService.close()
- `src/features/side-nav/side-nav.style.css` - Z-index fix for config card muting
- `src/state.js` - Added wasConfigHeaderExpandedBeforeModal and configHeaderLocked flags
- `src/main.js` - Added renderFocusDisplay() call in updateActiveWorkoutPreservingLogs()
**Debugging Journey**:
1. First attempt: State restoration after renderAll() - FAILED (timing issue)
2. Second attempt: Setting state BEFORE renderAll() - FAILED
3. Third attempt: Lock mechanism - FAILED (event still bubbling)
4. Fourth attempt: Centralized unlock timing - FAILED
5. Fifth attempt: closeAllExceptConfigHeader() - FAILED
6. Debug logging revealed: State TRUE after unlock, FALSE on render - event bubbling to handleClickOutside()
7. Final solution: event.stopPropagation() in list item handler
**Technical Discoveries**:
- Event bubbling continues after handler completes - must explicitly stop propagation
- Lock mechanism alone insufficient if event still bubbles to document level
- Debug logging critical for identifying state change timing
- Modal state preservation requires tracking before modal opens (not after)
- Dual-mode side tracking critical for exercise reset/swap operations
- PNG muscle group icons provide better visual clarity than emoji
**Status**: COMPLETE - Config dropdown persists correctly, dynamic icons working, all styling complete, dual-mode clear bug fixed

### **v6.21 - Session Cycling Bug Fixes & Session Stack Enhancement**
**Date**: 2025-10-02
**Problem**: Critical session cycling double-click bug after Reset, animations restarting on session changes, Plan Quick Button font/spacing issues
**Solution**: Fixed state/config name mismatch, prevented unnecessary re-renders, corrected font inheritance, added stacked "Remain" text to Session Quick Button
**Key Achievements**:
- **Session cycling fixed**: Corrected `state.js` initial session name "Recommended:" → "Standard:" (matches config.js v6.17 rename)
- **Animation preservation**: Modified `updateActiveWorkoutPreservingLogs()` to skip active card/log re-render for normal session cycling (only re-render for dual-mode changes)
- **Plan Quick Button styling**: Fixed font-size inheritance (1rem → 1.25rem), added explicit Roboto font, weight 500, proper 7px/-3px/9px spacing
- **Session Quick Button stack**: Added "Remain" text stacked under "# Mins" with matching font/color/spacing
- **First-click reliability**: Session cycling works on first click after Reset/page load
- **4-second pulse preserved**: Exercise card border glow and button animations no longer restart on session cycling
**Root Causes Identified**:
- **Double-click bug**: State/config name mismatch from incomplete v6.17 migration ("Recommended:" vs "Standard:")
- **Animation restart**: Workout log length change triggered full re-render of active card (line 69-73 in main.js)
- **Font size issue**: `.icon-bar` 1rem font-size inherited by child buttons, overriding intended 1.25rem
**Technical Architecture**:
- Session cycling flow: `cycleNextSession()` → `handleTimeChange()` → `updateActiveWorkoutPreservingLogs()` → setTimeout(50ms) → `renderSessionDisplay()`
- Stack layout pattern: Padding 7px/9px top/bottom, first span margin-bottom -3px (7px visual gap), line-height 1.2
- Render condition: `if (oldLogLength !== newLogLength && (appState.superset.isActive || appState.partner.isActive))` preserves animations
- Font cascade fix: Set font-size on `.icon-bar-item.icon-plan-wide` to override parent `.icon-bar`
**Files Modified**:
- `src/state.js` - Fixed initial currentTimeOptionName (Recommended → Standard)
- `src/main.js` - Modified re-render condition, changed RAF to setTimeout(50)
- `src/features/config-header/config-header.template.js` - Added `getSessionTimeText()` helper, removed inline styles from Plan Quick Button
- `src/features/config-header/config-header.style.css` - Added `.session-quick-button-stack` CSS, fixed Plan Quick Button font inheritance
- `src/features/config-header/config-header.index.js` - Updated `renderSessionDisplay()` to handle stacked spans, updated comments (Recommended → Standard)
- `src/services/actionService.js` - Calls `updateActiveWorkoutPreservingLogs()` for session cycling (not just `updateWorkoutTimeRemaining()`)
**Debugging Discoveries**:
- Console logging revealed state was "Recommended:" but config expected "Standard:"
- First click cycled Recommended→Standard (appeared as no-op), second click Standard→Express (worked correctly)
- Animation restart traced to workout log length comparison triggering active card re-render
- Font size issue traced to CSS specificity: parent `.icon-bar` 1rem inherited by all children
**Technical Discoveries**:
- State/config consistency critical after config renames - must update all references
- Conditional re-renders must check mode context to preserve animations
- CSS font-size inheritance from parent containers can override child declarations
- Stack layout using negative margins (-3px) creates consistent visual gaps with line-height 1.2
**Status**: COMPLETE - All session cycling issues resolved, animations preserved, fonts corrected, stack feature added

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
