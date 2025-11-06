/* ==========================================================================
   REP TARGET SERVICE - Centralized rep target calculation

   Purpose: Calculate target reps based on current week in training plan.
            Replaces hardcoded "10" reps default throughout the application.

   Week-Based Rep Targets:
   - Uses plan's weeklyReps object (e.g., week1: 10, week4: 6, week7: 2)
   - Falls back to 10 if no plan confirmed or week data missing
   - Updates automatically as user advances through plan weeks

   Dependencies: appState (plan, myPlanPage)
   Used by: Workout log generation, template labels, progression service
   ========================================================================== */

import { appState } from "state";

/**
 * Get target reps for current week in training plan
 * @returns {number} - Target reps for current week (default: 10)
 */
export function getRepTarget() {
  const { activePlanId, currentWeekNumber } = appState.ui.myPlanPage;

  // Return default if no active plan or no week number
  if (!activePlanId || !currentWeekNumber) {
    return 10;
  }

  // Find active plan
  const activePlan = appState.plan.plans.find((p) => p.id === activePlanId);

  if (!activePlan || !activePlan.weeklyReps) {
    return 10;
  }

  // Get reps for current week
  const weekKey = `week${currentWeekNumber}`;
  const reps = activePlan.weeklyReps[weekKey];

  // Fall back to 10 if week data missing
  return reps !== undefined && reps !== null ? reps : 10;
}
