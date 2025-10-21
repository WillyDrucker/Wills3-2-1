/* ==========================================================================
   ACTION HANDLERS - Config Header

   Handles config header toggle, session cycling, and cancel operations.
   Implements snapshot/restore pattern for cancel functionality and
   Quick Button animation triggers on config close.

   Config Header Locking:
   - Lock prevents collapse during selector operations
   - Unlock after operation completes and selectors close
   - Ensures expanded state persists during day/plan/exercise changes

   Quick Button Animations (on "Let's Go!" close only):
   - Compares snapshot to current state on config close
   - Triggers grow-snap animations on changed Quick Buttons
   - Never triggers on Cancel (state restored)

   Session Cycling:
   - Triggers "Let's Go!" pulse only if not already pulsing
   - Won't interrupt ongoing pulse from superset/partner/day changes

   Dependencies: appState, config-card.header, selectorAnimationService,
                 persistenceService, selectorService
   Used by: actionHandlers.index.js (combined action map)
   ========================================================================== */

import { appState } from "state";
import * as selectorService from "services/ui/selectorService.js";
import { triggerLetsGoButtonPulse, stopLetsGoButtonPulse } from "services/ui/selectorAnimationService.js";
import * as persistenceService from "services/core/persistenceService.js";
import {
  renderConfigHeader,
  notifyConfigHeaderToggled,
  cancelConfigChanges,
  cycleNextSession,
  cyclePreviousSession,
} from "features/config-card/config-card.header.index.js";

/**
 * Get config header action handlers
 * @param {Object} coreActions - Core action dependencies
 * @returns {Object} Config header action handlers
 */
export function getConfigHandlers(coreActions) {
  return {
    cycleNextSession: () => {
      cycleNextSession();
      coreActions.updateActiveWorkoutPreservingLogs();
      // Trigger pulse only if not already pulsing (won't interrupt ongoing animation)
      triggerLetsGoButtonPulse(appState);
    },

    cyclePreviousSession: () => {
      cyclePreviousSession();
      coreActions.updateActiveWorkoutPreservingLogs();
      // Trigger pulse only if not already pulsing (won't interrupt ongoing animation)
      triggerLetsGoButtonPulse(appState);
    },

    toggleConfigHeader: () => {
      const openSelector = document.querySelector("details[open]");
      if (openSelector) {
        const isInsideConfigHeader = openSelector.closest("#config-header");
        const isInsideModal = openSelector.closest(".superset-modal-container, .config-modal-container");
        const isInConfigGroup = isInsideConfigHeader || isInsideModal;
        if (!isInConfigGroup) {
          selectorService.closeAll();
          return;
        }
      }

      const wasExpanded = appState.ui.isConfigHeaderExpanded;
      appState.ui.isConfigHeaderExpanded = !appState.ui.isConfigHeaderExpanded;

      // Create snapshot when opening (for Cancel restoration)
      if (!wasExpanded && appState.ui.isConfigHeaderExpanded) {
        appState.ui.configHeaderSnapshot = {
          currentDayName: appState.session.currentDayName,
          currentTimeOptionName: appState.session.currentTimeOptionName,
          currentSessionColorClass: appState.session.currentSessionColorClass,
          superset: {
            isActive: appState.superset.isActive,
            day1: appState.superset.day1,
            day2: appState.superset.day2,
            bonusMinutes: appState.superset.bonusMinutes,
            timeDeductionSetIndexes: [...(appState.superset.timeDeductionSetIndexes || [])]
          },
          partner: {
            isActive: appState.partner.isActive,
            user1Day: appState.partner.user1Day,
            user2Day: appState.partner.user2Day
          },
          workoutLog: appState.session.workoutLog ? [...appState.session.workoutLog] : null
        };
      }

      // Stop pulse when closing config
      if (wasExpanded && !appState.ui.isConfigHeaderExpanded) {
        stopLetsGoButtonPulse(appState);
      }

      // Detect changes for Quick Button animations (only on "Let's Go!" close)
      let animationFlags = null;
      if (wasExpanded && !appState.ui.isConfigHeaderExpanded && appState.ui.configHeaderSnapshot) {
        const snapshot = appState.ui.configHeaderSnapshot;

        // Check what changed
        const dayChanged = appState.session.currentDayName !== snapshot.currentDayName;
        const sessionChanged = appState.session.currentTimeOptionName !== snapshot.currentTimeOptionName;
        const supersetChanged = appState.superset.isActive !== snapshot.superset.isActive ||
                                appState.superset.day1 !== snapshot.superset.day1 ||
                                appState.superset.day2 !== snapshot.superset.day2;
        const partnerChanged = appState.partner.isActive !== snapshot.partner.isActive ||
                               appState.partner.user1Day !== snapshot.partner.user1Day ||
                               appState.partner.user2Day !== snapshot.partner.user2Day;

        // Determine which buttons to animate
        animationFlags = {
          animatePlan: supersetChanged || partnerChanged,
          animateFocus: dayChanged || supersetChanged || partnerChanged,
          animateSession: sessionChanged
        };
      }

      notifyConfigHeaderToggled();
      renderConfigHeader(animationFlags);
      persistenceService.saveState();
    },

    cancelConfigHeaderChanges: () => {
      cancelConfigChanges();
    },
  };
}
