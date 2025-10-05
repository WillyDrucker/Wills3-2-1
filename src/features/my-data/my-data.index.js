/* ==========================================================================
   MY DATA - Business Logic

   Handles My Data page interactions: tab changes, week navigation, history
   clearing. Manages calendar week offset and renders page.

   🔒 CEMENT: Week navigation wiring
   - Direct event listeners for calendar week buttons (no delegate reliance)
   - Prevents week offset going below 0 (current week)

   Dependencies: appState, ui, getMyDataPageTemplate, persistenceService
   Used by: actionService (myData actions)
   ========================================================================== */

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

  /* 🔒 CEMENT: Direct week navigation wiring (no reliance on external delegates) */
  const container = ui.mainContent;
  container.querySelectorAll('.week-nav-button[data-action="previousWeek"]')
    .forEach(btn => btn.addEventListener('click', handlePreviousWeek));
  container.querySelectorAll('.week-nav-button[data-action="nextWeek"]')
    .forEach(btn => btn.addEventListener('click', handleNextWeek));

}
