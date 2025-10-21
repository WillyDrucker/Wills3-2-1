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
   - profile: User profile and settings

   Dependencies: navigationService, persistenceService
   Used by: actionHandlers.index.js (combined action map)
   ========================================================================== */

import * as navigationService from "services/core/navigationService.js";
import * as persistenceService from "services/core/persistenceService.js";
import { handleCloseSideNav } from "features/side-nav/side-nav.index.js";

/**
 * Get navigation action handlers
 * @param {Object} coreActions - Core action dependencies (renderAll)
 * @returns {Object} Navigation action handlers
 */
export function getNavigationHandlers(coreActions) {
  return {
    goHome: () => {
      navigationService.goToPage("home");
      coreActions.renderAll();
      persistenceService.saveState();
    },

    goToWorkout: () => {
      navigationService.goToPage("workout");
      coreActions.renderAll();
      persistenceService.saveState();
    },

    goToMyData: () => {
      navigationService.goToPage("myData");
      coreActions.renderAll();
      persistenceService.saveState();
    },

    goToProfile: () => {
      navigationService.goToPage("profile");
      // Close side nav when navigating to profile
      handleCloseSideNav();
      coreActions.renderAll();
      persistenceService.saveState();
    },
  };
}
