/* ==========================================================================
   ACTION HANDLERS - Main Coordinator

   Assembles all action handler modules into a single unified action map.
   Delegates to specialized modules organized by functionality:

   Modules:
   - Navigation: Page routing (home, workout, myData, profile)
   - Config: Config header toggle, session cycling, cancel
   - Selectors: Day/plan/time/exercise/history selections
   - Workout: Log/skip/edit workout sets
   - Modals: All modal operations (superset, partner, reset, video, etc.)
   - Global: Utilities (sidenav, scroll, auth, fullscreen, etc.)

   Architecture:
   - Each module exports a getter function that receives coreActions dependencies
   - Main coordinator calls all getters and merges results into single map
   - Exported via getActionHandlers() and getSelectorHandlers()

   Config Header Locking:
   - Lock prevents collapse during selector operations
   - Unlock after operation completes and selectors close
   - Ensures expanded state persists during day/plan/exercise changes

   "Let's Go!" Button Pulse Triggers:
   - confirmSuperset: Triggered immediately when selector displays after confirmation
   - confirmPartnerWorkout: Triggered immediately when selector displays after confirmation
   - handleDaySelection: Triggered immediately when Current Focus selector displays
   - cycleNextSession: Triggered only if not already pulsing (non-interrupting)
   - cyclePreviousSession: Triggered only if not already pulsing (non-interrupting)
   - handleTimeSelection: Triggered only if not already pulsing (non-interrupting)
   - Animation runs in parallel with selector grow/glow animations
   - Session changes won't interrupt ongoing pulse from superset/partner/day changes

   Quick Button Grow Animations (on "Let's Go!" close only):
   - toggleConfigHeader: Detects changes in plan/focus/session values
   - Compares snapshot to current state on config close
   - Triggers grow-snap animations on changed Quick Buttons
   - Animations run simultaneously, never on Cancel

   Dependencies: All action handler modules
   Used by: actions/actionService.js (action delegation system)
   ========================================================================== */

import { initializeConfigHeader } from "features/config-card/config-card.header.index.js";
import { getNavigationHandlers } from "./actionHandlers.navigation.js";
import { getConfigHandlers } from "./actionHandlers.config.js";
import { getSelectorHandlers as getSelectorHandlersModule } from "./actionHandlers.selectors.js";
import { getWorkoutHandlers } from "./actionHandlers.workout.js";
import { getModalHandlers } from "./actionHandlers.modals.js";
import { getGlobalHandlers } from "./actionHandlers.global.js";

let coreActions = {};

/**
 * Initialize action handlers with core dependencies
 * @param {Object} dependencies - Core action dependencies from actionService
 */
export function initialize(dependencies) {
  coreActions = dependencies;
  initializeConfigHeader(dependencies.updateActiveWorkoutPreservingLogs);
}

/**
 * Get all action handlers (combined from all modules)
 * @returns {Object} Complete action handler map
 */
export function getActionHandlers() {
  return {
    ...getNavigationHandlers(coreActions),
    ...getConfigHandlers(coreActions),
    ...getWorkoutHandlers(coreActions),
    ...getModalHandlers(coreActions),
    ...getGlobalHandlers(coreActions),
  };
}

/**
 * Get selector-specific action handlers
 * Kept separate for organizational clarity (selector delegation pattern)
 * @returns {Object} Selector action handler map
 */
export function getSelectorHandlers() {
  return getSelectorHandlersModule(coreActions);
}
