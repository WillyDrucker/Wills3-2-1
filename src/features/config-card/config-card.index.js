import { appState } from "state";
import { ui } from "ui";
import { getConfigCardTemplate } from "./config-card.template.js";
import { timeOptions } from "config";
import * as navigationService from "services/navigationService.js";

export function renderConfigCard() {
  ui.configSection.innerHTML = getConfigCardTemplate();
}

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
}

export function handlePlanChange(newPlanName) {
  if (appState.session.currentWorkoutPlanName === newPlanName) return;
  appState.session.currentWorkoutPlanName = newPlanName;
}

export function handleTimeChange(newTimeOption) {
  if (appState.session.currentTimeOptionName === newTimeOption) return;
  appState.session.currentTimeOptionName = newTimeOption;
  const selectedOption = timeOptions.find((t) => t.name === newTimeOption);
  if (selectedOption) {
    appState.session.currentSessionColorClass = selectedOption.colorClass;
  }
}
