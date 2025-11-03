/* ==========================================================================
   ACTION HANDLERS - Page Navigation

   Handles primary page navigation actions within the app.
   Updates currentPage in appState and triggers full re-render.

   Navigation Flow:
   1. Call navigationService.goToPage(pageName)
   2. Render all UI (renderAll)
   3. Save state to localStorage

   Pages:
   - home: Main workout page
   - workout: Alias for home (legacy support)
   - myData: Workout history and data visualization
   - myPlan: Training plan selection and duration tracking
   - profile: User profile and settings

   Dependencies: navigationService, persistenceService
   Used by: actionHandlers.index.js (combined action map)
   ========================================================================== */

import * as navigationService from "services/core/navigationService.js";
import * as persistenceService from "services/core/persistenceService.js";
import { handleCloseSideNav } from "features/side-nav/side-nav.index.js";
import { appState } from "state";

/**
 * Clear My Data page selector state when navigating away
 * Implements "One-Selector-To-Rule-Them-All" - close all selectors on page navigation
 */
function clearMyDataSelectors() {
  appState.ui.selectedHistoryWorkoutId = null;
  appState.ui.selectedWorkoutId = null;
}

/**
 * Get navigation action handlers
 * @param {Object} coreActions - Core action dependencies (renderAll)
 * @returns {Object} Navigation action handlers
 */
export function getNavigationHandlers(coreActions) {
  return {
    goHome: () => {
      clearMyDataSelectors();
      navigationService.goToPage("home");
      coreActions.renderAll();
      persistenceService.saveState();
    },

    goToWorkout: () => {
      clearMyDataSelectors();
      navigationService.goToPage("workout");
      coreActions.renderAll();
      persistenceService.saveState();
    },

    goToMyData: () => {
      // Don't clear selectors when navigating TO My Data page
      navigationService.goToPage("myData");
      coreActions.renderAll();
      persistenceService.saveState();
    },

    goToMyPlan: () => {
      clearMyDataSelectors();
      navigationService.goToPage("myPlan");
      coreActions.renderAll();
      persistenceService.saveState();
    },

    goToProfile: () => {
      clearMyDataSelectors();
      navigationService.goToPage("profile");
      // Close side nav when navigating to profile
      handleCloseSideNav();
      coreActions.renderAll();
      persistenceService.saveState();
    },
  };
}
