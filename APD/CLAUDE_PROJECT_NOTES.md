# WILL'S 3-2-1 PROJECT NOTES

**Project**: Will's 3-2-1 Workout Tracking Application
**Tech Stack**: Vanilla JavaScript, ES Modules, CSS Tokens
**Philosophy**: SUPER STUPID SIMPLE (SSS), REMOVE DON'T ADD

## VERSION CHANGELOG

### **v6.8 - Timer Shadows and Dual-Mode Logic Fixes Complete**
**Date**: 2025-09-27
**Problem**: Timer shadows not visible, skip animation retriggering on dual timers, dual-mode completion stuck with unbalanced exercises, skip actions bypassing alternating rules
**Solution**: Comprehensive timer service and dual-mode logic improvements
**Key Achievements**:
- Fixed timer drop shadows across all components using tokenized `--text-shadow-subtle`
- Resolved skip animation retriggering by adding cycle ID isolation between dual-mode timers
- Implemented unbalanced exercise count handling - allows consecutive completion when one side finished
- Applied alternating pattern rules to skip actions (same as log actions)
- Cleaned up all CSS files removing !important flags and adding proper documentation
**Technical Discoveries**:
- Line-height: 0.7 constraint required different shadow approach than expected
- Dual-mode timer completion needed cycle ID tracking to prevent animation cross-contamination
- Skip and log actions must follow identical validation logic for consistent user experience
- Tokenized shadow system provides consistency across all timer displays
**Files Modified**:
- `timerService.js` - Added cycle ID tracking, section headers, removed inline styles
- `workoutService.js` - Added findNextDualModeExercise() and canLogDualModeSide() functions
- `active-exercise-card.index.js` - Added skip validation and documentation headers
- `dual-mode.colors.css`, `dual-mode.active-card.css` - Tokenized shadows
- `active-exercise-card.action-area.css`, `active-exercise-card.state-active.css` - Cleaned shadows
- `workoutFactoryService.js` - Added skipAnimationCycleId field
- `_variables.css` - Added --text-shadow-subtle token
**Status**: COMPLETE - Timer shadows visible, dual-mode logic robust for unbalanced workouts

### **v6.7 - Dual-Mode Layout Precision Spacing Complete**
**Date**: 2025-09-26
**Problem**: Dual-mode layout had imprecise spacing and duplicate/legacy code after v6.6 harmonization
**Solution**: Fine-tuned spacing measurements and cleaned up code architecture
**Key Achievements**:
- Fixed header to selector spacing (3px → 7px visual) by using template inline style override
- Repositioned action prompt overlay from selector to fuel gauges using template integration
- Achieved perfect 16px visual rhythm for Minutes Remaining (11px CSS → 16px visual above, 12px CSS → 16px visual below)
- Removed duplicate "Begin Exercise - Log Results" text by cleaning action area template
- Cleaned up legacy minutes remaining code from header section - flattened architecture
**Technical Discoveries**:
- Template inline styles override CSS specificity - critical for precise spacing control
- Visual spacing consistently differs 3-4px from CSS values due to font metrics and line-height
- Action prompt overlay must be positioned within fuel gauge template for proper centering
- Global CSS reset requires `!important` flags for margin control in dual-mode
**Files Modified**:
- Template files: workoutCard.js, fuelGauge.js, actionArea.js - structural improvements
- CSS files: dual-mode.header.css, dual-mode.fuel-gauge.css, dual-mode.spacing.css - precision spacing
**Status**: COMPLETE - 🔒 CEMENTed precision spacing ready for production

### **v6.6 - Dual-Mode Layout Harmonization Complete**
**Date**: 2025-09-25
**Problem**: Dual-mode (superset/partner) layout didn't match updated normal active-exercise card structure
**Solution**: Comprehensive layout update to harmonize with normal mode changes
**Key Achievements**:
- Fuel gauges moved directly below exercise selector (from original position)
- Minutes Remaining line moved above Log Set buttons (matching normal mode)
- Input selectors repositioned below fuel gauge (new layout order)
- Weight/Reps positions swapped: Reps left, Weight right (consistency with normal mode)
- Single-line header maintained for dual-mode (different from normal mode's two-line)
**Technical Architecture**:
- Created component-based CSS file structure: header, selector, inputs, fuel-gauge
- Preserved critical CSS table layout for positioning stability (🔒 CEMENT)
- Maintained 100px selector height exception to prevent layout shifts
- Applied tokenized spacing variables for 16px rhythm consistency
- Updated HTML template structure in `active-exercise-card.templates.workoutCard.js`
**Files Created**:
- `dual-mode.header.css` - Single-line header styling
- `dual-mode.selector.css` - Exercise selector with height exception
- `dual-mode.inputs.css` - Swapped input grid layout
- `dual-mode.fuel-gauge.css` - Dual gauge positioning and spacing
**Status**: COMPLETE - Layout harmonized while preserving dual-mode stability

### **v6.5 - Workout Log Animation System Complete**
**Date**: 2025-09-25
**Problem**: v6.4 left text color animation unresolved + timestamp color shift issues
**Final Solutions**:
- Perfect grow/snap timing: 900ms grow + 100ms snap (optimized from 850ms/150ms)
- Green buildup animation: 500ms to peak, 500ms fade back
- Fixed timestamp color shift by removing duplicate `.text-skip` CSS rule
- Eliminated blackout by using explicit color tokens instead of `inherit`
**Technical Achievements**:
- 🔒 CEMENTed animation timing and color system
- Tokenized green color using `--text-green-plan`
- Separate animations for value (white) and unit (gray) text
- Added text rendering stability with `backface-visibility` and `antialiased`
- Standardized documentation across all workout-log files
**Status**: COMPLETE - 🔒 CEMENTed animation system ready for production

### **v6.4 - Workout Log Animation System Overhaul**
**Date**: 2025-09-24
**Status**: SUPERSEDED by v6.5 - See above for final implementation

### **v6.3 - Workout Log Perfect Spacing Achievement**
**Date**: 2025-09-24
**Problem**: Workout log items needed precise 9px/8px/9px spacing in 50px containers
**Solution**: Absolute positioning with compensated spacing for border states
**Key Achievements**:
- Perfect 9px/8px/9px rhythm for unfilled logs
- Perfect 7px/8px/7px rhythm for filled logs (border compensation)
- Fixed "Enter Full Screen" button text shifting (17/18 maintained)
- Standardized all text to 1rem with 600 weight
**Status**: COMPLETE - 🔒 CEMENTed to prevent regression

### **v6.2 - CRITICAL: Dual-Mode 2px Shift Bug Resolution**
**Date**: 2025-09-23
**Problem**: Persistent 2px shift of buttons when timers start in dual-mode workouts
**Root Cause**: CSS Grid rebalancing columns based on timer vs button content width differences
**Solution**: Replaced CSS Grid with CSS table layout using `table-layout: fixed` and transparent border gaps
**Key Innovation**: Transparent borders create 16px visual gap without affecting button sizing
**Impact**: ELIMINATED ALL POSITIONING SHIFTS - Critical stability improvement
**Status**: COMPLETE - CEMENTed with 🔒 markers to prevent regression

### **v6.1 - Feature-Based Architecture Refactor**
**Date**: 2025-09-23
**Problem**: Dual-mode and fuel-gauge files scattered across directories
**Solution**: Created dedicated feature folders with modular CSS organization
**Status**: COMPLETE - Clean architecture with preserved functionality

### **v5.3.6 - Global CSS Reset Discovery & Final Workaround Solution**
**Date**: 2025-09-23
**Problem**: Margins not working despite nuclear CSS specificity
**Root Cause**: Global CSS reset + multiple !important declarations in component files
**Solution**: Required !important flags to override architectural constraints
**Status**: COMPLETE - 16px/16px/16px rhythm achieved with workarounds

### **v5.3.5 - Dual-Mode Spacing Architecture & CSS Cascade Resolution**
**Date**: 2025-09-23
**Problem**: Dual-mode spacing inconsistencies (8px/21px/14px instead of 16px)
**Root Cause**: CSS import order conflicts between dual-mode patterns and state files
**Solution**: Modified state-active.css to exclude dual-mode with :not() selectors
**Status**: Partial fix - led to v5.3.6 investigation

### **v5.3.4 - Dual-Mode Timer Sizing and Spacing Fix**
**Date**: 2025-09-22
**Problem**: Dual-mode timers too large and incorrect spacing
**Solution**: Fixed timer font-size to 5.0rem with higher CSS specificity
**Status**: Contains workarounds for mysterious spacing gaps

### **v5.3.3 - Fuel Gauge Animation System Rebuild**
**Date**: 2025-09-22
**Problem**: Fuel gauge segments resetting to initial color after 60-second animation
**Root Cause**: Missing CSS completed state rules after refactors
**Solution**: Rebuilt complete animation foundation with dynamic color system
**Status**: COMPLETE

### **v5.3.2 - Active Exercise Card Architecture Overhaul**
**Date**: Previous session
**Achievements**: Fixed card height shift, established dual color system, eliminated !important flags
**Status**: Foundation for subsequent spacing fixes

## CRITICAL DISCOVERIES

### **Global CSS Reset Constraint (v5.3.6)**
Found that `* { margin: 0; padding: 0; }` combined with component-level !important declarations prevents normal margin control, requiring architectural workarounds.

### **CSS Table Layout Stability (v6.2)**
CSS Grid's content-based column balancing causes positioning instability. CSS table with `table-layout: fixed` provides content-independent equal columns, eliminating layout shifts.

### **CSS Import Order Dependencies (v5.3.5)**
Import sequence in main style files affects cascade specificity, requiring careful ordering and exclusion selectors for dual-mode patterns.

### **CEMENT System Established (v5.3.2)**
Implemented 🔒 markers to protect critical architectural decisions that solve specific bugs or timing issues.