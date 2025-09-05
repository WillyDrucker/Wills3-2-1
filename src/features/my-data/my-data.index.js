import { appState } from "state";
import { ui } from "ui";
import { getMyDataPageTemplate } from "./my-data.template.js";
import * as persistenceService from "services/persistenceService.js";

export function handleHistoryTabChange(newTab) {
  if (appState.ui.myDataPage.selectedTab === newTab) return;
  appState.ui.myDataPage.selectedTab = newTab;
  renderMyDataPage();
}

export function handlePreviousWeek() {
  appState.ui.myDataPage.weekOffset++;
  renderMyDataPage();
}

export function handleNextWeek() {
  if (appState.ui.myDataPage.weekOffset <= 0) return;
  appState.ui.myDataPage.weekOffset--;
  renderMyDataPage();
}

export function handleClearHistory() {
  appState.user.history.workouts = [];
  persistenceService.saveState();
  renderMyDataPage();
}

export function renderMyDataPage() {
  ui.configSection.innerHTML = "";
  ui.mainContent.innerHTML = getMyDataPageTemplate();
  ui.workoutFooter.innerHTML = "";
}
