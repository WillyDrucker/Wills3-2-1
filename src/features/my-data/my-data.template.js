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
import { getAllPlanSpanSelectorsHTML } from "./my-data.templates.planSpanSelector.js";
import { getWeekRange } from "utils";

function getHistorySelectorHTML() {
  const { selectedTab } = appState.ui.myDataPage;

  // Mute this selector if a workout session selector is active (One-Selector-To-Rule-Them-All)
  const isWorkoutSelectorActive = appState.ui.selectedHistoryWorkoutId !== null;

  const summaryHtml = `<div class="selector-content history-selector-content">
    <div class="item-main-line truncate-text">
      <span class="text-on-surface-medium">My&nbsp;${selectedTab.split(' ')[0]}&nbsp;</span><span class="data-highlight text-plan">${selectedTab.split(' ')[1]}</span>
    </div>
  </div>`;

  const options = ["Workout Results", "Plan Results"];
  const optionsHtml = options
    .filter((opt) => opt !== selectedTab)
    .map(
      (opt) => `<li data-history-tab="${opt}" class="history-selector-option">
        <div class="selector-content">
          <div class="item-main-line truncate-text">
            <span class="text-on-surface-medium">My&nbsp;${opt.split(' ')[0]}&nbsp;</span><span class="data-highlight text-plan">${opt.split(' ')[1]}</span>
          </div>
        </div>
      </li>`
    )
    .join("");

  return createSelectorHTML(
    "history-selector-details",
    summaryHtml,
    optionsHtml,
    isWorkoutSelectorActive // Disable selector if workout session selector is active
  );
}

export function getMyDataPageTemplate() {
  const { selectedTab, weekOffset, yearOffset } = appState.ui.myDataPage;
  let logContentHtml = "";
  let navigatorHtml = "";

  // Generate navigator based on selected tab
  if (selectedTab === "Workout Results") {
    // Week-based navigation for workouts
    const weekRange = getWeekRange(weekOffset);
    const nextButtonDisabled = weekOffset === 0 ? "disabled" : "";

    navigatorHtml = `
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
      </div>`;

    logContentHtml = getWorkoutCalendarHTML();
  } else if (selectedTab === "Plan Results") {
    // Year-based navigation for plan results
    const currentYear = 2025 + yearOffset;
    const currentDate = new Date();
    const canGoToNextYear = currentDate.getFullYear() > currentYear;
    const prevButtonDisabled = "disabled"; // Can't go before 2025
    const nextButtonDisabled = canGoToNextYear ? "" : "disabled";

    navigatorHtml = `
      <div class="week-navigator year-navigator">
        <button class="week-nav-button year-nav-prev week-chevron week-chevron-left" ${prevButtonDisabled}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M20 24L12 16L20 8" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="week-range-text text-plan">${currentYear}</span>
        <button class="week-nav-button year-nav-next week-chevron week-chevron-right" ${nextButtonDisabled}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M12 8L20 16L12 24" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>`;

    // Plan Results content: month text + plan span selectors
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const planSpanSelectorsHtml = getAllPlanSpanSelectorsHTML();

    logContentHtml = `
      <div class="workout-log-content-area history-content-area">
        <hr class="history-divider modal-divider" />
        <div class="plan-results-month-header">
          <div class="history-day-date-text">${currentMonth}</div>
        </div>
        <div class="plan-results-selectors">
          ${planSpanSelectorsHtml}
        </div>
      </div>`;
  }

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
    <div class="card my-data-card history-card" id="workout-history-card">
        <div class="card-content-container">
            <div class="card-title history-week-title">History</div>
            <div class="selector-container history-selector-container">
                ${getHistorySelectorHTML()}
            </div>
            ${navigatorHtml}
            ${logContentHtml}
        </div>
    </div>
    ${clearDailyDataButton}
  `;
}