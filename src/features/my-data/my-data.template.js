/* ==========================================================================
   MY DATA - HTML Template

   Generates My Data page HTML with performance card and history calendar.
   Includes tab selector (Workouts/Conditioning/Stretching) and week navigator.

   Dependencies: appState, ui, createSelectorHTML, getWorkoutCalendarHTML, getWeekRange
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
            <div class="history-week-header">
                <div class="card-title history-week-title">History</div>
                <div class="week-navigator">
                    <button class="week-nav-button week-nav-prev" data-action="previousWeek">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                    </button>
                    <span class="week-range-text text-plan">${weekRange}</span>
                    <button class="week-nav-button week-nav-next" data-action="nextWeek" ${nextButtonDisabled}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                    </button>
                </div>
            </div>
            <div class="selector-container history-selector-container">
                ${getHistorySelectorHTML()}
            </div>
            ${logContentHtml}
        </div>
    </div>
  `;
}