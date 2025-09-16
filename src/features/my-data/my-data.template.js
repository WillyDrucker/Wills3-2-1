import { appState } from "state";
import { ui } from "ui";
import { createSelectorHTML } from "ui";
import { getWorkoutCalendarHTML } from "./my-data.templates.calendarView.js";

function getHistorySelectorHTML() {
  const { selectedTab } = appState.ui.myDataPage;

  const summaryHtml = `<div class="selector-content">
    <div class="item-main-line truncate-text">
      <span class="text-on-surface-medium">My </span>
      <span class="data-highlight text-plan">${selectedTab}</span>
    </div>
  </div>`;

  const options = ["Workouts", "Conditioning", "Stretching"];
  const optionsHtml = options
    .filter((opt) => opt !== selectedTab)
    .map(
      (opt) => `<li data-history-tab="${opt}">
        <div class="selector-content">
          <div class="item-main-line truncate-text">
            <span class="text-on-surface-medium">My </span>
            <span class="data-highlight text-plan">${opt}</span>
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
  const { selectedTab } = appState.ui.myDataPage;
  let logContentHtml = "";

  if (selectedTab === "Workouts") {
    logContentHtml = getWorkoutCalendarHTML();
  } else if (selectedTab === "Conditioning") {
    logContentHtml = `<div class="card my-data-card"><div class="card-content-container"><h2 class="card-header"><span class="truncate-text">Conditioning Logs</span></h2><p class="no-history-text">Your conditioning logs will appear here.</p></div></div>`;
  } else if (selectedTab === "Stretching") {
    logContentHtml = `<div class="card my-data-card"><div class="card-content-container"><h2 class="card-header"><span class="truncate-text">Stretching Logs</span></h2><p class="no-history-text">Your stretching logs will appear here.</p></div></div>`;
  }

  return `
    <div class="card my-data-card">
      <div class="card-content-container">
        <h2 class="card-header"><span class="truncate-text">Performance</span></h2>
        <div class="action-button-container" style="margin-top: 3px;">
          <button class="action-button button-primary" disabled>Show Chart</button>
        </div>
      </div>
    </div>
    <div class="card my-data-card" id="history-selector-card">
      <div class="card-content-container">
        <h2 class="card-header"><span class="truncate-text">Training History</span></h2>
        ${getHistorySelectorHTML()}
      </div>
    </div>
    ${logContentHtml}
  `;
}
