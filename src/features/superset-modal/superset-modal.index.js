import { appState } from "state";
import { ui } from "ui";
import { getSupersetModalTemplate } from "./superset-modal.template.js";
import * as workoutService from "services/workoutService.js";
import * as workoutFactoryService from "services/workoutFactoryService.js";
import * as workoutMetricsService from "services/workoutMetricsService.js";
import * as modalService from "services/modalService.js";
import { getNextWorkoutDay } from "utils";

export function handleSupersetSelection(selector, day) {
  appState.ui.supersetModal.selection[selector] = day;
  if (selector === "day1" && day === appState.ui.supersetModal.selection.day2) {
    appState.ui.supersetModal.selection.day2 = getNextWorkoutDay(day);
  }
  renderSupersetModal();

  const summaryText = document.querySelector(
    `#superset-selector-${selector === "day1" ? 1 : 2} [data-animation-target]`
  );
  if (summaryText) {
    const animationClass =
      selector === "day1"
        ? "is-animating-selection-green"
        : "is-animating-selection-yellow";
    summaryText.classList.add(animationClass);
    setTimeout(() => summaryText.classList.remove(animationClass), 2000);
  }
}

export function handleConfirmSuperset() {
  const { day1, day2 } = appState.ui.supersetModal.selection;
  if (!day1 || !day2 || day1 === day2) return;

  // CEMENTED FIX: Enforce mutual exclusivity. Reset partner state before activating superset state.
  appState.partner.isActive = false;
  appState.partner.user1Day = null;
  appState.partner.user2Day = null;

  appState.superset.isActive = true;
  appState.superset.day1 = day1;
  appState.superset.day2 = day2;

  appState.session.workoutLog =
    workoutFactoryService.generateSupersetWorkoutLog();

  const metrics = workoutMetricsService.calculateSupersetWorkoutMetrics(
    appState.superset.day1,
    appState.superset.day2,
    appState.session.currentTimeOptionName
  );
  appState.superset.bonusMinutes = metrics.bonusMinutes;

  const firstDaySets = appState.session.workoutLog
    .map((log, index) => (log.supersetSide === "left" ? index : -1))
    .filter((index) => index !== -1);
  appState.superset.timeDeductionSetIndexes = firstDaySets.slice(
    -metrics.bonusMinutes
  );

  workoutService.recalculateCurrentStateAfterLogChange();

  // Restore config header expanded state from before modal opened
  const shouldRestoreExpandedState = appState.ui.wasConfigHeaderExpandedBeforeModal;
  if (shouldRestoreExpandedState) {
    appState.ui.isConfigHeaderExpanded = true;
    appState.ui.wasConfigHeaderExpandedBeforeModal = false;
  }

  modalService.close();

  // Note: Unlock happens AFTER updateActiveWorkoutAndLog() in actionService
}

export function renderSupersetModal() {
  const container = ui.supersetModalContainer;
  container.classList.toggle(
    "is-hidden",
    appState.ui.activeModal !== "superset"
  );
  if (appState.ui.activeModal === "superset") {
    container.innerHTML = getSupersetModalTemplate();
  } else {
    container.innerHTML = "";
  }
}
