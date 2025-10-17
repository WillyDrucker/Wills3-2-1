/* ==========================================================================
   MY DATA - Business Logic

   Handles My Data page interactions: tab changes, week navigation, admin
   Clear Today's Data button. Loads workout history from database on every
   render for real-time display of latest data.

   Architecture: Database-first rendering
   - Every render loads workouts from Supabase (source of truth)
   - Admin feature: Clear Today's Data for willy.drucker@gmail.com
   - Silent deletion: No browser prompts, missing workouts confirm deletion
   - Week offset management: Prevents navigation below 0 (current week)

   🔒 CEMENT: Week navigation wiring
   - Direct event listeners for calendar week buttons (no delegate reliance)
   - Prevents week offset going below 0 (current week)

   Dependencies: appState, ui, getMyDataPageTemplate, persistenceService,
                 workoutSyncService
   Used by: actionService (myData actions)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getMyDataPageTemplate } from "./my-data.template.js";
import * as persistenceService from "services/core/persistenceService.js";
import { loadWorkoutsFromDatabase, clearTodaysWorkouts } from "services/data/workoutSyncService.js";

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

export async function handleClearDailyData() {
  const result = await clearTodaysWorkouts();

  if (result.success) {
    // Silently refresh the page - deletion confirmed by missing workouts
    renderMyDataPage();
  } else {
    // Log error to console only (no browser prompts)
    console.error(`Error clearing daily data: ${result.error}`);
  }
}

export async function renderMyDataPage() {
  // Load workout history from database
  if (appState.auth?.isAuthenticated) {
    const { workouts } = await loadWorkoutsFromDatabase();
    appState.user.history.workouts = workouts;
  }

  ui.configSection.innerHTML = "";
  ui.mainContent.innerHTML = getMyDataPageTemplate();
  ui.workoutFooter.innerHTML = "";

  /* 🔒 CEMENT: Direct week navigation wiring (no reliance on external delegates) */
  const container = ui.mainContent;
  container.querySelectorAll('.week-nav-button[data-action="previousWeek"]')
    .forEach(btn => btn.addEventListener('click', handlePreviousWeek));
  container.querySelectorAll('.week-nav-button[data-action="nextWeek"]')
    .forEach(btn => btn.addEventListener('click', handleNextWeek));

  // Admin-only: Wire up Clear Daily Data button
  const clearButton = container.querySelector('.clear-daily-data-button');
  if (clearButton) {
    clearButton.addEventListener('click', handleClearDailyData);
  }
}
