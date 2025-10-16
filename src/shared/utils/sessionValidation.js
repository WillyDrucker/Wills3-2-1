/* ==========================================================================
   SESSION VALIDATION UTILITIES - Session Cycling Validation

   Validates whether cycling to a different session type (Standard/Express/
   Maintenance) is allowed based on logged exercise sets. Purely reactive to
   current log state - clearing sets releases locks.

   Session cycling validation rules (reactive to log state):
   - 0-2 Major1 sets logged: All sessions available (Standard/Express/Maintenance)
   - 3rd set logged from Major1: Locked to Standard/Express (can't go to Maintenance)
   - 3rd set logged from different muscle group: Locked to Maintenance (can't go to Standard/Express)
   - Clearing sets releases locks: If 3rd set cleared → all sessions available again
   - Standard ↔ Express: Allowed only if Express has remaining pending sets
   - Standard: Always available (baseline workout with all sets)

   Dependencies: appState, timeOptions, workoutLogGenerationService
   Used by: Config header (session cycling buttons), action handlers
   ========================================================================== */

import { appState } from "state";
import { timeOptions } from "config";
import { generateWorkoutLog, generateSupersetWorkoutLog, generatePartnerWorkoutLog } from "services/workout/workoutLogGenerationService.js";

/**
 * Helper: Count logged Major1 muscle group sets
 */
function countLoggedMajor1Sets() {
  const currentLog = appState.session.workoutLog;
  if (!currentLog || currentLog.length === 0) return 0;

  return currentLog.filter(
    (log) => log.exercise.muscle_group === "Major1" && log.status !== "pending"
  ).length;
}

/**
 * Helper: Count total logged sets (any muscle group)
 */
function countTotalLoggedSets() {
  const currentLog = appState.session.workoutLog;
  if (!currentLog || currentLog.length === 0) return 0;

  return currentLog.filter((log) => log.status !== "pending").length;
}

/**
 * Helper: Check if a 3rd set from a different muscle group has been logged
 * This indicates the Maintenance path has diverged
 */
function hasNonMajor1ThirdSet() {
  const currentLog = appState.session.workoutLog;
  if (!currentLog || currentLog.length === 0) return false;

  const loggedSets = currentLog.filter((log) => log.status !== "pending");

  // Need at least 3 logged sets total
  if (loggedSets.length < 3) return false;

  // Check if we have exactly 2 Major1 sets and a 3rd set from different muscle group
  const major1Sets = loggedSets.filter((log) => log.exercise.muscle_group === "Major1");
  const nonMajor1Sets = loggedSets.filter((log) => log.exercise.muscle_group !== "Major1");

  // If we have 2 Major1 sets and at least 1 non-Major1 set, Maintenance path has diverged
  return major1Sets.length === 2 && nonMajor1Sets.length >= 1;
}

/**
 * Helper: Check if Express session would have any pending sets remaining
 * Simulates what the Express workout would be and checks for pending sets
 */
function hasExpressSetsPending() {
  const { superset, partner, session } = appState;

  // Generate Express workout log based on current mode
  let expressLog;
  if (superset.isActive) {
    expressLog = generateSupersetWorkoutLog();
  } else if (partner.isActive) {
    expressLog = generatePartnerWorkoutLog();
  } else {
    expressLog = generateWorkoutLog(true, "Express");
  }

  // Merge with existing logged sets
  const currentLog = session.workoutLog || [];
  const mergedLog = [];

  // Keep logged sets that exist in Express structure
  currentLog.forEach((oldEntry) => {
    if (oldEntry.status !== "pending") {
      const matchInExpressLog = expressLog.find(
        (newEntry) =>
          newEntry.exercise.exercise_name === oldEntry.exercise.exercise_name &&
          newEntry.setNumber === oldEntry.setNumber
      );

      if (matchInExpressLog) {
        mergedLog.push(oldEntry);
      }
    }
  });

  // Add pending sets from Express structure
  expressLog.forEach((newEntry) => {
    const alreadyLogged = mergedLog.find(
      (merged) =>
        merged.exercise.exercise_name === newEntry.exercise.exercise_name &&
        merged.setNumber === newEntry.setNumber
    );

    if (!alreadyLogged) {
      mergedLog.push(newEntry);
    }
  });

  // Check if any pending sets remain
  return mergedLog.some((log) => log.status === "pending");
}

/**
 * Validates whether cycling to a target session type is allowed.
 * Purely reactive - bases decision only on current log state.
 * Clearing sets automatically releases locks.
 *
 * Returns true if safe to cycle, false if blocked.
 */
export function canCycleToSession(targetSessionName) {
  const targetOption = timeOptions.find((t) => t.name === targetSessionName);
  if (!targetOption) return false;

  const targetType = targetOption.type;

  const currentLog = appState.session.workoutLog;
  if (!currentLog || currentLog.length === 0) return true;

  // Get current session type
  const currentSessionName = appState.session.currentTimeOptionName;
  const currentOption = timeOptions.find((t) => t.name === currentSessionName);
  const currentType = currentOption?.type;

  const loggedMajor1Count = countLoggedMajor1Sets();
  const totalLoggedSets = countTotalLoggedSets();

  // Standard (Recommended) always allowed - baseline workout with all sets
  if (targetType === "Recommended") return true;

  // Allow cycling from Express back to Standard
  if (currentType === "Express" && targetType === "Recommended") {
    return true;
  }

  // Check if 3rd set has been logged (determines lock state)
  const has3rdMajor1Set = loggedMajor1Count >= 3;
  const has3rdNonMajor1Set = hasNonMajor1ThirdSet();

  // Trying to cycle TO Maintenance
  if (targetType === "Maintenance") {
    // Block if 3rd Major1 set logged (Standard/Express path committed)
    if (has3rdMajor1Set) {
      return false;
    }
    // Otherwise allow (0-2 Major1 sets logged, or cleared back to 2)
    return true;
  }

  // Trying to cycle TO Express
  if (targetType === "Express") {
    // Block if 3rd set is from different muscle group (Maintenance path has diverged)
    if (has3rdNonMajor1Set) {
      return false;
    }
    // Block if no pending sets would remain in Express
    if (!hasExpressSetsPending()) {
      return false;
    }
    // Otherwise allow
    return true;
  }

  return true;
}

/**
 * Helper: Check if session cycling is completely locked (both directions blocked)
 * Used to determine if session quick button should be muted.
 * Reactive to log state - clearing sets releases the lock.
 */
export function isSessionCyclingLocked() {
  const currentSessionName = appState.session.currentTimeOptionName;
  const currentOption = timeOptions.find((t) => t.name === currentSessionName);
  const currentType = currentOption?.type;

  // If currently in Standard, check if both Express and Maintenance are unavailable
  if (currentType === "Recommended") {
    const canGoToExpress = timeOptions.some(
      (opt) => opt.type === "Express" && canCycleToSession(opt.name)
    );
    const canGoToMaintenance = timeOptions.some(
      (opt) => opt.type === "Maintenance" && canCycleToSession(opt.name)
    );

    // Locked if neither Express nor Maintenance available
    if (!canGoToExpress && !canGoToMaintenance) {
      return true;
    }
  }

  // Locked to Maintenance if 3rd set from different muscle group logged
  if (currentType === "Maintenance" && hasNonMajor1ThirdSet()) {
    return true; // Express blocked, Standard always allowed (so not fully locked, but chevrons should be muted)
  }

  // If in Express, check if only Standard available
  if (currentType === "Express") {
    const canGoToMaintenance = timeOptions.some(
      (opt) => opt.type === "Maintenance" && canCycleToSession(opt.name)
    );

    // Locked if only Standard available (Maintenance blocked)
    if (!canGoToMaintenance) {
      return true;
    }
  }

  return false;
}

