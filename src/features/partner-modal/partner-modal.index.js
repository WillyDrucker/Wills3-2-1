/* ==========================================================================
   PARTNER MODAL - Business Logic

   Handles partner workout configuration: user day selection, validation, state
   management, and confirmation. Enforces mutual exclusivity with superset mode.

   🔒 CEMENT: Partner/Superset mutual exclusivity
   - Resets superset state completely before activating partner
   - Restores config header state after modal confirmation

   Dependencies: appState, ui, workoutService, workoutFactoryService, modalService
   Used by: actionService (openPartnerMode, confirmPartnerWorkout)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getPartnerModalTemplate } from "./partner-modal.template.js";
import * as workoutService from "services/workoutService.js";
import * as workoutFactoryService from "services/workoutFactoryService.js";
import * as modalService from "services/modalService.js";

export function handlePartnerDaySelection(user, day) {
  appState.partner[user] = day;
  renderPartnerModal();
}

export function handleConfirmPartnerWorkout() {
  const { user1Day, user2Day } = appState.partner;
  if (!user1Day || !user2Day) return;

  /* 🔒 CEMENT: Mutual exclusivity - reset superset state before activating partner */
  appState.superset.isActive = false;
  appState.superset.day1 = null;
  appState.superset.day2 = null;
  appState.superset.bonusMinutes = 0;
  appState.superset.timeDeductionSetIndexes = [];

  appState.partner.isActive = true;

  appState.session.workoutLog =
    workoutFactoryService.generatePartnerWorkoutLog();

  workoutService.recalculateCurrentStateAfterLogChange();

  /* 🔒 CEMENT: Config header state restoration preserves dropdown UX */
  const shouldRestoreExpandedState = appState.ui.wasConfigHeaderExpandedBeforeModal;
  if (shouldRestoreExpandedState) {
    appState.ui.isConfigHeaderExpanded = true;
    appState.ui.wasConfigHeaderExpandedBeforeModal = false;
  }

  modalService.close();

  // Note: Unlock happens AFTER updateActiveWorkoutAndLog() in actionService
}

export function renderPartnerModal() {
  const container = ui.partnerModalContainer;
  container.classList.toggle(
    "is-hidden",
    appState.ui.activeModal !== "partner"
  );
  if (appState.ui.activeModal === "partner") {
    container.innerHTML = getPartnerModalTemplate();
  } else {
    container.innerHTML = "";
  }
}
