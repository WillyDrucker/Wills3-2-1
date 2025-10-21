/* ==========================================================================
   ACTION HANDLERS - Global Utilities

   Handles global utility actions:
   - Side navigation open/close
   - Authentication (sign out)
   - Fullscreen toggle
   - Scrolling utilities
   - Animation replay
   - Data management (nuke everything)
   - Mode switching (normal mode)
   - History navigation (My Data week cycling)

   These actions are used across multiple pages and features, not tied
   to specific components or workflows.

   Dependencies: side-nav, authService, fullscreen, scrollService,
                 navigationService, persistenceService, my-data
   Used by: actionHandlers.index.js (combined action map)
   ========================================================================== */

import * as navigationService from "services/core/navigationService.js";
import * as selectorService from "services/ui/selectorService.js";
import * as persistenceService from "services/core/persistenceService.js";
import { signOut as authSignOut } from "services/authService.js";
import { toggleFullScreen } from "lib/fullscreen.js";
import {
  handleOpenSideNav,
  handleCloseSideNav,
} from "features/side-nav/side-nav.index.js";
import {
  handlePreviousWeek,
  handleNextWeek,
} from "features/my-data/my-data.index.js";
import { resetToDefaults } from "features/config-card/config-card.index.js";

/**
 * Get global utility action handlers
 * @param {Object} coreActions - Core action dependencies
 * @returns {Object} Global utility action handlers
 */
export function getGlobalHandlers(coreActions) {
  return {
    // === SIDE NAVIGATION ===
    openSideNav: handleOpenSideNav,

    closeSideNav: handleCloseSideNav,

    closeSideNavIfBlank: (e) => {
      if (e.target.classList.contains("side-nav-content"))
        handleCloseSideNav();
    },

    // === AUTHENTICATION ===
    signOut: async () => {
      const { error } = await authSignOut();
      if (error) {
        console.error("Sign out error:", error);
      }
      handleCloseSideNav();
    },

    // === FULLSCREEN ===
    toggleFullScreen: () => {
      toggleFullScreen();
      handleCloseSideNav();
    },

    // === SCROLLING ===
    scrollToTop: () => window.scrollTo({ top: 0, behavior: 'smooth' }),

    scrollToActiveCard: () => {
      const activeCardElement = document.getElementById('active-exercise-card') || document.getElementById('dual-mode-card');
      if (activeCardElement) {
        activeCardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },

    // === ANIMATION ===
    replayAnimation: (e) => {
      const container = e.target.closest(".completion-animation-container");
      if (!container) return;
      const plates = container.querySelectorAll(".plate");
      plates.forEach((plate) => {
        plate.style.animation = "none";
        void plate.offsetHeight;
        plate.style.animation = "";
      });
    },

    // === DATA MANAGEMENT ===
    nukeEverything: persistenceService.nukeEverything,

    // === MODE SWITCHING ===
    setNormalMode: () => {
      selectorService.closeAll();
      navigationService.setNormalMode();
      coreActions.updateActiveWorkoutAndLog();
    },

    resetToDefaults: () => {
      resetToDefaults();
      coreActions.updateActiveWorkoutAndLog();
      coreActions.renderAll();
    },

    // === HISTORY NAVIGATION ===
    previousWeek: handlePreviousWeek,

    nextWeek: handleNextWeek,
  };
}
