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

  // CEMENTED FIX: Enforce mutual exclusivity. Reset superset state before activating partner state.
  appState.superset.isActive = false;
  appState.superset.day1 = null;
  appState.superset.day2 = null;
  appState.superset.bonusMinutes = 0;
  appState.superset.timeDeductionSetIndexes = [];

  appState.partner.isActive = true;

  appState.session.workoutLog =
    workoutFactoryService.generatePartnerWorkoutLog();

  workoutService.recalculateCurrentStateAfterLogChange();
  modalService.close();
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
