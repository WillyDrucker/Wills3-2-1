/* ==========================================================================
   CONFIG HEADER - Session Cycling

   Handles session type cycling (Standard/Express/Maintenance) with
   time option validation and state updates.

   Session Cycling Rules:
   - Only cycle to sessions defined in timeOptions config
   - Skip unavailable sessions (e.g., no Maintenance if not configured)
   - Update currentTimeOptionName, currentSessionColorClass, workoutTimeRemaining
   - Preserve workout log (updateActiveWorkoutPreservingLogs pattern)

   Dependencies: appState, timeOptions config, canCycleToSession utility,
                 handleTimeChange, updateWorkoutTimeRemaining
   Used by: actionHandlers.config.js (cycleNextSession, cyclePreviousSession)
   ========================================================================== */

import { appState } from "state";
import { timeOptions } from "config";
import { canCycleToSession } from "utils";
import { handleTimeChange } from "./config-card.index.js";
import { updateWorkoutTimeRemaining } from "services/workout/workoutService.js";

/**
 * Check if can cycle to next session
 * @returns {boolean} True if next session is available and not at end
 */
export function canCycleNext() {
  const currentIndex = timeOptions.findIndex((t) => t.name === appState.session.currentTimeOptionName);

  // Can't cycle right if at the last option (linear, not circular)
  if (currentIndex >= timeOptions.length - 1) return false;

  const nextSession = timeOptions[currentIndex + 1];
  return canCycleToSession(nextSession.name);
}

/**
 * Check if can cycle to previous session
 * @returns {boolean} True if previous session is available and not at start
 */
export function canCyclePrevious() {
  const currentIndex = timeOptions.findIndex((t) => t.name === appState.session.currentTimeOptionName);

  // Can't cycle left if at the first option (linear, not circular)
  if (currentIndex <= 0) return false;

  const prevSession = timeOptions[currentIndex - 1];
  return canCycleToSession(prevSession.name);
}

/**
 * Cycle to next session type (linear, not circular)
 * Called by action handler which triggers pulse animation
 */
export function cycleNextSession() {
  if (!canCycleNext()) return;

  const currentIndex = timeOptions.findIndex((t) => t.name === appState.session.currentTimeOptionName);
  const nextSession = timeOptions[currentIndex + 1];
  handleTimeChange(nextSession.name);
  updateWorkoutTimeRemaining();
}

/**
 * Cycle to previous session type (linear, not circular)
 * Called by action handler which triggers pulse animation
 */
export function cyclePreviousSession() {
  if (!canCyclePrevious()) return;

  const currentIndex = timeOptions.findIndex((t) => t.name === appState.session.currentTimeOptionName);
  const prevSession = timeOptions[currentIndex - 1];
  handleTimeChange(prevSession.name);
  updateWorkoutTimeRemaining();
}
