# WILL'S 3-2-1 PROJECT NOTES

**Project**: Will's 3-2-1 Workout Tracking Application
**Tech Stack**: Vanilla JavaScript, ES Modules, CSS Tokens
**Philosophy**: SUPER STUPID SIMPLE (SSS), REMOVE DON'T ADD

## VERSION CHANGELOG

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