/* ==========================================================================
   SUPERSET MODAL - HTML Template

   Generates superset modal HTML with two day selectors (green/yellow scheme).
   Displays chronologically ordered workout days starting from today, filters
   out rest days and already selected days.

   Dependencies: appState (weeklyPlan, todayDayName, ui.supersetModal.selection)
   Used by: superset-modal.index.js (renderSupersetModal)
   ========================================================================== */

import { appState } from "state";

export function getSupersetModalTemplate() {
  const { selection } = appState.ui.supersetModal;
  const { day1, day2 } = selection;
  const today = appState.todayDayName;

  const allDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const todayIndex = allDays.indexOf(today);

  const chronologicallyOrderedDays = [
    ...allDays.slice(todayIndex),
    ...allDays.slice(0, todayIndex),
  ];

  const availableDays = chronologicallyOrderedDays.filter(
    (day) => appState.weeklyPlan[day]?.title !== "Rest"
  );

  const createDayOptions = (currentSelection, otherSelection) =>
    availableDays
      .filter((d) => d !== currentSelection && d !== otherSelection)
      .map((day) => {
        const workout = appState.weeklyPlan[day];
        if (!workout) return "";
        const dayColorClass = day === today ? "text-plan" : "text-deviation";
        const dayDisplay = `${workout.title} (${workout.type})`;
        return `<li data-day="${day}"><div class="item-main-line truncate-text">${day}: <span class="data-highlight ${dayColorClass}">${dayDisplay}</span></div></li>`;
      })
      .join("");

  const getDaySummary = (selectedDay, colorClass) => {
    const info = appState.weeklyPlan[selectedDay];
    if (!info) return `<div class="selector-content">...</div>`;
    const display =
      info.title === "Rest" ? info.title : `${info.title} (${info.type})`;
    return `<div class="selector-content"><div class="item-main-line truncate-text">${selectedDay}: <span class="data-highlight ${colorClass}" data-animation-target="true">${display}</span></div></div>`;
  };

  return `
      <div class="superset-modal-backdrop" data-action="closeSupersetModal"></div>
      <div class="superset-modal-content card">
          <h2 class="card-header">Superset</h2>
          <details class="app-selector" id="superset-selector-1">
              <summary>${getDaySummary(day1, "text-plan")}</summary>
              <ul class="options-list">${createDayOptions(day1, day2)}</ul>
          </details>

          <h2 class="card-header with-header">With</h2>
          <details class="app-selector" id="superset-selector-2">
              <summary>${getDaySummary(day2, "text-warning")}</summary>
              <ul class="options-list">${createDayOptions(day2, day1)}</ul>
          </details>
          <div class="superset-modal-actions">
              <button class="action-button button-cancel" data-action="closeSupersetModal">Cancel</button>
              <button class="action-button button-log" data-action="confirmSuperset">Superset!</button>
          </div>
      </div>
    `;
}
