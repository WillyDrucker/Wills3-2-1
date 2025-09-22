import { appState } from "state";
import { ui } from "ui";
import { getConfigCardTemplate } from "./config-card.template.js";
import { timeOptions } from "config";
import * as navigationService from "services/navigationService.js";

export function renderConfigCard() {
  ui.configSection.innerHTML = getConfigCardTemplate();
}

/* 🔒 CEMENT: Current Focus selector controls timer colors only */
export function handleDayChange(newDayName) {
  if (appState.superset.isActive || appState.partner.isActive) {
    navigationService.setNormalMode();
  }

  if (
    appState.session.currentDayName === newDayName &&
    !appState.superset.isActive &&
    !appState.partner.isActive
  )
    return;

  appState.session.currentDayName = newDayName;

  // 🔒 CEMENT: Update timer color to match selected day (separate from header colors)
  const timerColorClass = newDayName === appState.todayDayName ? "text-plan" : "text-deviation";
  appState.session.currentTimerColorClass = timerColorClass;
}

export function handlePlanChange(newPlanName) {
  if (appState.session.currentWorkoutPlanName === newPlanName) return;
  appState.session.currentWorkoutPlanName = newPlanName;
}

/* 🔒 CEMENT: Current Session selector controls header colors only */
export function handleTimeChange(newTimeOption) {
  if (appState.session.currentTimeOptionName === newTimeOption) return;
  appState.session.currentTimeOptionName = newTimeOption;
  const selectedOption = timeOptions.find((t) => t.name === newTimeOption);
  if (selectedOption) {
    // Updates header colors (Minutes Remaining, clock) - NOT timer colors
    appState.session.currentSessionColorClass = selectedOption.colorClass;
  }
}
