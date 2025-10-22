# WILL'S 3-2-1 PROJECT NOTES

## Purpose

This file contains the historical record of version changes for Will's 3-2-1. Detailed changelog information can be added here as work progresses. When the file grows too large, older versions will be condensed to 2-3 line summaries to keep the file manageable. Recent versions (current phase of work) remain detailed. For current architectural patterns and session state, see CLAUDE_SESSION_HANDOFF.md.

**Documentation Flow**: Items too detailed for CLAUDE_SESSION_HANDOFF.md are summarized there with full details provided here. Items too big for PROJECT_NOTES can overflow to CLAUDE_ACTIVE.md as an extension.

---

**Project**: Will's 3-2-1 Workout Tracking Application
**Tech Stack**: Vanilla JavaScript, ES Modules, CSS Tokens
**Philosophy**: SUPER STUPID SIMPLE (SSS), REMOVE DON'T ADD

---

## VERSION CHANGELOG

### **AI Performance Refactoring - Phase 1-4** (2025-01-21)

**Mission**: Large-scale refactoring to improve AI performance by breaking monolithic files (>150 lines) into focused modules.

**Key Achievements**: Split 6 large files into 31 focused modules (login-page 7 files, actionHandlers 8 files, workoutSyncService 5 files, profile-page 3 files, config-card.header 5 files + CSS 3 files). Established re-export wrapper pattern for backward compatibility. Applied CLAUDE standards to 21 files (100% compliance). All modules <150 lines except 6 cohesive units (254, 300, 153, 182, 219, 217 lines - kept together for readability).

**Status**: COMPLETE - All files pass syntax validation, backward compatible, documented to standards

---

### **My Data Week Navigation Improvements & Standards Application** (2025-01-21)

**Mission**: Fix week navigation bugs, improve UI consistency with config-card chevrons, apply CLAUDE_DEV_STANDARDS to all modified files.

**Previous Session Work**:
- **Bug Fix**: Week navigation double-click (skipping weeks Oct 20-26 to Oct 6-12) - Fixed duplicate event handling (direct listeners + action delegation)
- **UI Enhancement**: Replaced My Data calendar week buttons with config-card session selector style chevrons (50×32px buttons, 32×32px stroke-based icons)
- **Layout Reorganization**: Moved week navigator below "My Workouts" selector with full-width chevrons and centered calendar text
- **Scroll Behavior**: Changed Current Exercise selector from always-scroll to conditional scroll (only when dropdown overflows viewport)
- **Spacing Precision**: Fine-tuned visual spacing (History 16px from top, 7px to selector; navigator 16px from selector, 16px to calendar)

**Current Session Work**:
- Applied CLAUDE_DEV_STANDARDS to 6 files (my-data.template.js, my-data.index.js, my-data.header.css, my-data.history-spacing.css, actionHandlers.global.js, scrollService.js)
- Added Standard #6 to CLAUDE_DEV_STANDARDS.md: CEMENT Comments - Legacy Pattern (Phasing Out)
- Updated all file headers with proper architecture documentation, CEMENT justifications, dependencies, and section organization

**Key Technical Details**:
- **Duplicate Event Prevention**: Removed data-action attributes from week navigation buttons, using direct class selectors (.week-nav-prev, .week-nav-next)
- **Chevron Matching**: SVG 32×32 viewBox with stroke-width 3, matches config-card session selector exactly
- **Nuclear Reset Override**: my-data.history-spacing.css uses !important flags to override nuclear reset for History title and week navigator
- **Visual Spacing Accounting**: Fine-tuned margins account for font metrics (4px = 7px visual, 15px = 16px visual)
- **Conditional Scrolling**: getBoundingClientRect() viewport overflow detection prevents unnecessary scroll jumping

**Files Modified** (7 total):
- `src/features/my-data/my-data.template.js` - Week navigator HTML structure, chevron SVG icons
- `src/features/my-data/my-data.index.js` - Direct event listener wiring, duplicate prevention
- `src/features/my-data/my-data.header.css` - History title and week navigator styling with precise spacing
- `src/features/my-data/my-data.history-spacing.css` - Nuclear reset overrides with !important flags
- `src/services/actions/actionHandlers.global.js` - Removed week navigation handlers (duplicate prevention)
- `src/services/ui/scrollService.js` - Conditional scroll logic for exercise selector
- `APD/CLAUDE_DEV_STANDARDS.md` - Added Standard #6: CEMENT Comments guidance

**Status**: COMPLETE - Week navigation working correctly, UI matches config-card, all files documented to standards

---

### **v5.5.4 - Database Immediate Save System & Visual State Indicators**
**Date**: 2025-10-17
**Problem**: Need real-time database persistence for workout data, better visual indicators for workout state, polish on completion screen
**Solution**: Implemented immediate save architecture with sequential queue, swapped color scheme for semantic clarity, added animated button transitions on workout completion
**Key Achievements**:
- **Immediate save pattern**: Every log/skip/edit triggers instant database save (fire-and-forget)
- **Save queue implementation**: Sequential promise chain prevents race conditions from rapid logging
- **Visual state system**: Color swap for semantic meaning (Green = logged/complete, White = in-progress)
- **Admin Clear Today's Data**: Button for willy.drucker@gmail.com with silent deletion
- **Workout Results button**: Two-state animation (Workout Saved! → Begin Another Workout after 4s)
- **CLAUDE standards**: Applied comprehensive documentation to all 10 modified files
- **Issue closure**: Closed #33 (Database and history implementation) - all acceptance criteria met
**Root Causes Identified**:
- **Race conditions**: Multiple rapid logs could corrupt data without sequential save queue
- **Color semantics**: Green traditionally means complete/success, not in-progress
- **Missing feedback**: No visual confirmation of database save on workout completion
- **Documentation gaps**: Service files lacked Architecture sections explaining patterns
**Technical Architecture**:
- **Save queue**: Promise chain ensures saves complete in order (`saveQueue = saveQueue.then()`)
- **UPSERT pattern**: Check existence → UPDATE or INSERT to handle re-saves
- **Database-first rendering**: My Data loads from Supabase on every render (source of truth)
- **ID conversion**: Database stores strings, app uses numbers (conversion on load/save)
- **Fire-and-forget**: localStorage first (instant), then async database save (no blocking)
- **Silent deletion**: Clear Today's Data shows no prompts, missing workouts confirm deletion
**Files Created**:
- `src/services/data/workoutSyncService.js` - Database operations with save queue
**Files Modified** (10 total):
- `src/services/data/historyService.js` - Immediate save calls on log/skip operations
- `src/features/my-data/my-data.index.js` - Database-first rendering, Clear Today's Data handler
- `src/features/my-data/my-data.template.js` - Admin button (email check)
- `src/features/my-data/my-data.templates.calendarExercise.js` - Color swap logic
- `src/features/workout-results-card/workout-results-card.index.js` - Button state transition
- `src/features/workout-results-card/workout-results-card.template.js` - Initial button state
- `src/features/workout-results-card/workout-results-card.style.css` - Button styling
- `src/services/authService.js` - Reviewed (no changes needed)
**Database Architecture**:
- **workouts table**: id, user_id, timestamp, plan_name, session_type_name, session_color_class, body_part, body_part_color_key
- **workout_logs table**: workout_id (FK), user_id, exercise_data (JSONB), set_number, weight, reps, status, superset_side
- **Foreign keys**: ON DELETE CASCADE ensures logs deleted before workouts
- **Migration**: Automatically migrates localStorage workouts on first authenticated session
**Status**: COMPLETE - Database immediate save operational, visual state indicators deployed, completion screen polished, CLAUDE standards applied

---

## CONDENSED VERSION HISTORY

### v5.5.3 - Reset Modal Feature & CLAUDE Standards (2025-10-15)
**Achievements**: Three-option reset modal for non-dev users, applied CLAUDE standards to 12 authentication files, implemented selector muting system.
**Status**: Complete - Reset modal functional, authentication pages standardized

### v5.5.2 - Chrome Autofill Investigation (2025-10-09)
**Achievements**: Extensive testing of 9 CSS/JS approaches to fix autofill font-size, documented Chrome rendering layer limitation (unfixable), removed 131 lines of workaround code.
**Status**: Complete - Limitation documented, code cleaned up

### v5.5.1 - Supabase Authentication & Login Page (2025-10-08)
**Achievements**: Integrated Supabase auth system (signUp/signIn/resetPassword), polished login page with 16px/7px rhythm, applied CLAUDE standards.
**Status**: Complete - Authentication operational, login page polished

### v5.5.0 - Complete CLAUDE Standards Application (2025-10-05)
**Achievements**: Applied CLAUDE standards to all core files (config.js, main.js, state.js, index.css/html), split oversized CSS files (_selectors.css, _animations.css), fixed workout log bugs (falsy zero, animation timing).
**Status**: Complete - All core files documented, bugs fixed

### v6.29 - Config Quick Buttons & Session Cycling (2025-10-06)
**Achievements**: Made quick buttons clickable when muted (pointer-events override), rewrote session cycling validation to be purely reactive, fixed critical timer bug.
**Status**: Complete - Quick buttons accessible, session cycling logic correct

### v6.28 - Services Refactor & Utilities Reorganization (2025-10-05)
**Achievements**: Split timer and workout services into focused modules, reorganized shared utilities (6 modules), fixed UI bugs (scroll jump, descender cutoff, wake lock).
**Status**: Complete - Services modularized, utilities organized, bugs fixed

### v6.27 - Dual-Mode & Active-Exercise Documentation (2025-10-04)
**Achievements**: Applied CLAUDE documentation standards to 33 files (11 dual-mode CSS + 22 active-exercise), established JavaScript header pattern, formalized documentation in standards.
**Status**: Complete - All files documented to standards

### v6.26 - CSS Standards Refactor (2025-10-04)
**Achievements**: Comprehensive refactor of 6 CSS files, removed ~70 !important flags, complete tokenization, added "Let's Go!" confirmation button, established three-class specificity pattern.
**Status**: Complete - CSS enterprise-grade standards applied

### v6.25 - One-Selector-To-Rule-Them-All (2025-10-04)
**Achievements**: Implemented bidirectional group-based muting (Config/Exercise/Log groups), fixed animation preservation for dual-mode session cycling, established consistent muting visual standard.
**Status**: Complete - Full selector muting system operational

### v6.24 - Dual-Mode Responsive Design (2025-10-03)
**Achievements**: Fixed dual-mode timer overflow (5.0rem → 4.5rem), implemented responsive config buttons, matched Log Set button colors to timers, created session change preserve functions.
**Status**: Complete - Dual-mode responsive, session cycling preserves logged sets

### v6.23 - Config Dropdown Persistence (2025-10-03)
**Achievements**: Fixed config dropdown closing on Superset/Partner confirmation (setTimeout unlock), implemented bidirectional selector blocking, enhanced visual muting consistency.
**Status**: Complete - One-selector enforcement operational

### v6.22 - Config Dropdown & Dynamic Icons (2025-10-03)
**Achievements**: Fixed dropdown closing with stopPropagation, added dynamic Focus icons for dual modes, enhanced button styling (Cancel gray, Reset red), fixed dual-mode clear bug, z-index fix for hamburger menu.
**Status**: Complete - Dropdown persists, dynamic icons working

### v6.21 - Session Cycling Bug Fixes (2025-10-02)
**Achievements**: Fixed session cycling double-click bug (state/config name mismatch), prevented animation restarts (skip re-render), corrected Plan Quick Button font/spacing, added Session stack ("Remain" text).
**Status**: Complete - Session cycling works on first click, animations preserved

### v6.20 - Config-Header Dropdown Redesign (2025-10-01)
**Achievements**: Transformed config-header into dropdown overlay, flexible icon bar (Plan flex 1 | Bodypart 50px | Session flex 1), seamless blue border connection, no layout shift.
**Status**: Complete - Dropdown overlay working, no layout shifts

### v6.18 - Collapsible Config-Header (2025-09-30)
**Achievements**: Implemented collapsible config-header with icon bar (collapsed) and full controls (expanded), saved ~60-70px vertical space, state persistence across sessions.
**Status**: Complete - Collapsible header saving vertical space

### v6.17 - Session Cycling Implementation (2025-09-30)
**Achievements**: Implemented session cycling with chevrons, validation system (prevents removing logged sets), set preservation logic, animation-safe rendering (textContent not innerHTML), time recalculation, renamed "Recommended" to "Standard".
**Status**: Complete - Session cycling working with validation and preservation

---

## CRITICAL DISCOVERIES

### Chrome Autofill Font-Size Limitation (v5.5.2)
Chrome's autofill applies font-size at rendering layer that bypasses all CSS/JS. Nine approaches attempted - all failed. Font-size appears small on autofill, corrects on first user click. **Decision**: Accept as minor cosmetic issue.

### PNG Transparency Export (v6.19)
GIMP PNG export: uncheck "Save background color" for true transparency. Icons at root `/icons/` not `/public/icons/`.

### textContent vs innerHTML (v6.19)
`textContent` preserves focus and animations. `innerHTML` recreates DOM, restarts animations.

### CSS :has() Selector Power (v6.19)
`:has()` enables parent styling based on child state. Example: `#config-header:has(.config-header-group.expanded)`.

### CSS Table Layout Stability (v6.2)
CSS Grid's content-based balancing causes positioning instability. CSS table with `table-layout: fixed` provides content-independent equal columns.

### CEMENT System Established (v5.3.2)
🔒 emoji markers protect critical architectural decisions that solve specific bugs or timing issues.
