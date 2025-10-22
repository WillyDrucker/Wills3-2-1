/* ==========================================================================
   MY DATA - HTML Template

   Generates My Data page HTML with performance card, history calendar,
   tab selector, week navigator, and admin-only Clear Today's Data button.

   Architecture:
   - Week navigation: Full-width chevron buttons (50x32) below selector
   - Calendar range text centered between chevrons
   - Chevron icons match config-card session selector style (32x32 stroke-based)
   - Admin-only: Clear Today's Data button for willy.drucker@gmail.com
   - Email check via appState.auth.user.email
   - Button event listeners wired in my-data.index.js render function

   Dependencies: appState, ui, createSelectorHTML, getWorkoutCalendarHTML,
                 getWeekRange
   Used by: my-data.index.js (renderMyDataPage)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { createSelectorHTML } from "ui";
import { getWorkoutCalendarHTML } from "./my-data.templates.calendarView.js";
import { getWeekRange } from "utils";

function getHistorySelectorHTML() {
  const { selectedTab } = appState.ui.myDataPage;

  const summaryHtml = `<div class="selector-content history-selector-content">
    <div class="item-main-line truncate-text">
      <span class="text-on-surface-medium">My&nbsp;</span><span class="data-highlight text-plan">${selectedTab}</span>
    </div>
  </div>`;

  const options = ["Workouts", "Conditioning", "Stretching"];
  const optionsHtml = options
    .filter((opt) => opt !== selectedTab)
    .map(
      (opt) => `<li data-history-tab="${opt}" class="history-selector-option">
        <div class="selector-content">
          <div class="item-main-line truncate-text">
            <span class="text-on-surface-medium">My&nbsp;</span><span class="data-highlight text-plan">${opt}</span>
          </div>
        </div>
      </li>`
    )
    .join("");

  return createSelectorHTML(
    "history-selector-details",
    summaryHtml,
    optionsHtml
  );
}

export function getMyDataPageTemplate() {
  const { selectedTab, weekOffset } = appState.ui.myDataPage;
  let logContentHtml = "";

  if (selectedTab === "Workouts") {
    logContentHtml = getWorkoutCalendarHTML();
  } else if (selectedTab === "Conditioning") {
    logContentHtml = `<div class="card my-data-card conditioning-card"><div class="card-content-container"><div class="card-header conditioning-header">Conditioning Logs</div><p class="no-history-text conditioning-empty-text">Your conditioning logs will appear here.</p></div></div>`;
  } else if (selectedTab === "Stretching") {
    logContentHtml = `<div class="card my-data-card stretching-card"><div class="card-content-container"><div class="card-header stretching-header">Stretching Logs</div><p class="no-history-text stretching-empty-text">Your stretching logs will appear here.</p></div></div>`;
  }

  const weekRange = getWeekRange(weekOffset);
  const nextButtonDisabled = weekOffset === 0 ? "disabled" : "";

  // Admin-only: Clear Today's Data button for willy.drucker@gmail.com
  const isAdmin = appState.auth?.user?.email === "willy.drucker@gmail.com";
  const clearDailyDataButton = isAdmin
    ? `<div class="card my-data-card clear-daily-data-card">
        <div class="card-content-container">
          <button class="action-button button-clear-daily-data clear-daily-data-button">Clear Today's Data</button>
        </div>
      </div>`
    : "";

  return `
    <div class="card my-data-card performance-card">
      <div class="card-content-container">
        <div class="card-header performance-header">Performance</div>
        <div class="action-button-container performance-button-container">
          <button class="action-button button-primary performance-chart-button" disabled>Show Chart</button>
        </div>
      </div>
    </div>
    <div class="card my-data-card history-card" id="workout-history-card">
        <div class="card-content-container">
            <div class="card-title history-week-title">History</div>
            <div class="selector-container history-selector-container">
                ${getHistorySelectorHTML()}
            </div>
            <div class="week-navigator">
                <button class="week-nav-button week-nav-prev week-chevron week-chevron-left">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path d="M20 24L12 16L20 8" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <span class="week-range-text text-plan">${weekRange}</span>
                <button class="week-nav-button week-nav-next week-chevron week-chevron-right" ${nextButtonDisabled}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path d="M12 8L20 16L12 24" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            ${logContentHtml}
        </div>
    </div>
    ${clearDailyDataButton}
  `;
}