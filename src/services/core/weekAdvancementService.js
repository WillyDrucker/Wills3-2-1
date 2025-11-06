/* ==========================================================================
   WEEK ADVANCEMENT SERVICE - Automatic week progression tracking

   Purpose: Automatically detect Sunday transitions and advance currentWeekNumber
            Updates week tracking when calendar naturally progresses to Sunday

   Dependencies: appState, planWeekUtils, persistenceService
   Used by: appInitializerService (initialization and periodic checks)
   ========================================================================== */

import { appState } from "state";
import { getCurrentWeekNumber } from "../../shared/utils/planWeekUtils.js";
import * as persistenceService from "./persistenceService.js";

/**
 * Check if week needs advancement and update if necessary
 * Called on app init and periodically to detect Sunday transitions
 * @returns {boolean} - True if week was advanced
 */
export function checkAndAdvanceWeek() {
  const { activePlanId, startDate, currentWeekNumber } = appState.ui.myPlanPage;

  // Only advance if we have an active plan with a start date
  if (!activePlanId || !startDate) {
    return false;
  }

  // Calculate what week we SHOULD be on based on today's date
  const calculatedWeek = getCurrentWeekNumber(startDate);

  if (calculatedWeek === null) {
    return false;
  }

  // If calculated week is greater than stored week, advance it
  if (calculatedWeek > currentWeekNumber) {
    console.log(`[Week Advancement] Auto-advancing from Week ${currentWeekNumber} to Week ${calculatedWeek}`);

    appState.ui.myPlanPage.currentWeekNumber = calculatedWeek;
    persistenceService.saveState();

    return true;
  }

  return false;
}

/**
 * Initialize periodic week advancement checks
 * Checks every hour for Sunday transitions
 */
export function initializeDailyWeekCheck() {
  // Check immediately on init
  checkAndAdvanceWeek();

  // Then check every hour (3600000ms)
  // Frequent enough to catch Sunday transitions without excessive checks
  setInterval(() => {
    const wasAdvanced = checkAndAdvanceWeek();

    if (wasAdvanced) {
      // Week was advanced - trigger re-render if on home page
      // This will update all displays with new week data
      if (appState.ui.currentPage === "home") {
        // Import renderAll dynamically to avoid circular dependency
        import("../../main.js").then((module) => {
          if (module.renderAll) {
            module.renderAll();
          }
        });
      }
    }
  }, 3600000); // Check every hour
}
