/* ==========================================================================
   RESET MODAL - Business Logic

   Handles reset options modal display and state checking for non-dev users.
   Determines if workout defaults reset button should be disabled based on
   whether any sets have been logged in the current session.

   Reset Operations:
   1. Reset Workout Defaults - Restores workout config (disabled if sets logged)
   2. Reset Workout Defaults & Clear Logs - Restores config AND clears session logs
   3. Clear My Data - Clears all workout history from My Data page

   Dependencies: appState, getResetModalTemplate, resetToDefaults, persistenceService
   Used by: Modal container (data-action handlers)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getResetModalTemplate } from "./reset-modal.template.js";
import { resetToDefaults } from "features/config-card/config-card.index.js";
import * as persistenceService from "services/core/persistenceService.js";

/**
 * Get reset modal HTML
 * @returns {string} Modal HTML with conditional button states
 */
export function getResetModalHTML() {
  // Check if any sets have been completed or skipped (not just pending)
  const hasLoggedSets = appState.session.workoutLog.some(
    (log) => log.status === "completed" || log.status === "skipped"
  );

  return getResetModalTemplate(hasLoggedSets);
}

/**
 * Check if user can reset workout defaults
 * @returns {boolean} True if no sets logged (completed/skipped), false otherwise
 */
export function canResetWorkoutDefaults() {
  return !appState.session.workoutLog.some(
    (log) => log.status === "completed" || log.status === "skipped"
  );
}

/**
 * Reset workout to defaults for current day
 * Only available if no sets have been logged
 */
export function handleResetWorkoutDefaults() {
  if (!canResetWorkoutDefaults()) {
    console.warn("Cannot reset workout defaults - sets have been logged");
    return false;
  }

  resetToDefaults();
  persistenceService.saveState();
  return true;
}

/**
 * Reset workout to defaults AND clear all logged sets for current session
 */
export function handleResetWorkoutAndClearLogs() {
  // Reset configuration to defaults
  resetToDefaults();

  // Clear all logged sets from current session
  appState.session.workoutLog = [];
  appState.session.currentLogIndex = 0;
  appState.session.isWorkoutComplete = false;

  persistenceService.saveState();
}

/**
 * Clear all workout history from My Data page
 */
export function handleClearMyData() {
  appState.user.history.workouts = [];
  persistenceService.saveState();
}

/**
 * Render reset options modal
 * Shows/hides modal based on activeModal state
 */
export function renderResetOptionsModal() {
  const isVisible = appState.ui.activeModal === "resetOptions";

  if (isVisible) {
    ui.resetOptionsModalContainer.innerHTML = getResetModalHTML();
    ui.resetOptionsModalContainer.classList.remove("is-hidden");
  } else {
    ui.resetOptionsModalContainer.classList.add("is-hidden");
  }
}
