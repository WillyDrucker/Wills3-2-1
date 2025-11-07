/* ==========================================================================
   CONFIG HEADER - Main Coordinator

   Coordinates config header modules and provides unified exports:
   - Render functions (header, line, session, focus displays)
   - Cancel logic (state restoration from snapshot)
   - Session cycling (next/previous with validation)
   - Click-outside handling (auto-collapse on external click)

   Modular Structure:
   - config-card.header.render.js: Render functions + animation logic
   - config-card.header.cancel.js: Cancel/restore logic
   - config-card.header.session.js: Session cycling functions
   - config-card.header.handlers.js: Click-outside handler

   Quick Button Animations:
   - Triggered on "Let's Go!" close only (not Cancel)
   - Compares snapshot to current state
   - Animates Plan/Focus/Session buttons based on changes
   - Animations run simultaneously, never on Cancel

   Dependencies: All config-card.header modules
   Used by: actionHandlers.js, timer callbacks, workout services
   ========================================================================== */

import {
  renderConfigHeader as renderConfigHeaderImpl,
  renderConfigHeaderLine,
  renderSessionDisplay,
  renderFocusDisplay,
  renderPlanDisplay,
} from "./config-card.header.render.js";
import { cancelConfigChanges as cancelConfigChangesImpl } from "./config-card.header.cancel.js";
import {
  canCycleNext,
  canCyclePrevious,
  cycleNextSession,
  cyclePreviousSession,
} from "./config-card.header.session.js";
import {
  handleClickOutside,
  notifyConfigHeaderToggled,
  setCancelFunction,
  getIgnoreNextOutsideClickRef,
} from "./config-card.header.handlers.js";

// Core update function passed from main.js via initialization
let updateActiveWorkoutPreservingLogs = null;

/**
 * Initialize with core update function
 * Called from actionHandlers.js during app initialization
 */
export function initializeConfigHeader(updateFunction) {
  updateActiveWorkoutPreservingLogs = updateFunction;
}

/**
 * Cancel config changes wrapper
 * Calls cancel implementation with ignoreNextOutsideClick reference
 */
export function cancelConfigChanges() {
  const ignoreRef = getIgnoreNextOutsideClickRef();
  cancelConfigChangesImpl(ignoreRef);
}

/**
 * Render config header wrapper
 * Calls render implementation with click listener attachment callback
 */
export function renderConfigHeader(animationFlags = null) {
  const ignoreRef = getIgnoreNextOutsideClickRef();

  // Set cancel function reference for click-outside handler
  setCancelFunction(cancelConfigChanges);

  // Attach click listener callback
  const attachClickListener = () => {
    document.addEventListener('click', handleClickOutside);
  };

  renderConfigHeaderImpl(animationFlags, attachClickListener, ignoreRef);
}

// Re-export all functions for external use
export {
  renderConfigHeaderLine,
  renderSessionDisplay,
  renderFocusDisplay,
  renderPlanDisplay,
  canCycleNext,
  canCyclePrevious,
  cycleNextSession,
  cyclePreviousSession,
  notifyConfigHeaderToggled,
};
