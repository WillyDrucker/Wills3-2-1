/* ==========================================================================
   SUPERSET MODAL TEMPLATE

   Generates superset modal HTML with two day selectors (green/yellow scheme).
   Triggered from config-card Superset button.

   Purpose:
   - Displays chronologically ordered workout days starting from today
   - Filters out rest days and already selected days
   - Green scheme for day 1, yellow scheme for day 2
   - Uses shared confirmation modal classes from _confirmation-modals.css

   Architecture:
   - Title: "Superset" (uses confirmation-modal-title) → 16px space
   - "Primary Focus" label (uses confirmation-modal-question, 1.25rem/600, left-aligned) → 7px space
   - Day 1 Selector: Green text highlight (text-plan) → 16px space
   - "Secondary Focus" label (uses confirmation-modal-question, 1.25rem/600, left-aligned) → 7px space
   - Day 2 Selector: Yellow text highlight (text-warning) → 16px space
   - Button group: Cancel/Superset! (uses confirmation-modal-actions)

   Day Options Logic:
   - Chronologically ordered from today forward
   - Filters out rest days
   - Today appears first and shows as green (text-plan)
   - Other days show as blue (text-deviation)
   - Already selected days excluded from opposite selector

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
        return `<li data-day="${day}"><div class="item-main-line flex-line-container"><span class="flex-priority text-info">${day}:&nbsp;</span><span class="truncate-text data-highlight ${dayColorClass}">${dayDisplay}</span></div></li>`;
      })
      .join("");

  const getDaySummary = (selectedDay, selectorColorClass) => {
    const info = appState.weeklyPlan[selectedDay];
    if (!info) return `<div class="selector-content">...</div>`;
    const display =
      info.title === "Rest" ? info.title : `${info.title} (${info.type})`;
    // Use selector color (green for Primary, yellow for Secondary) as default
    return `<div class="selector-content"><div class="item-main-line flex-line-container"><span class="flex-priority text-info">${selectedDay}:&nbsp;</span><span class="truncate-text data-highlight ${selectorColorClass}" data-animation-target="true">${display}</span></div></div>`;
  };

  return `
      <div class="superset-modal-backdrop" data-action="closeSupersetModal"></div>
      <div class="superset-modal-content card confirmation-modal-card superset-card">
          <h2 class="confirmation-modal-title">Superset</h2>

          <p class="confirmation-modal-question" id="primary-focus-label">Primary Focus</p>
          <div class="app-selector" id="superset-primary-focus-selector" data-selector-type="day1">
              <div class="selector-display">${getDaySummary(day1, "text-plan")}</div>
              <ul class="options-list">${createDayOptions(day1, day2)}</ul>
          </div>

          <p class="confirmation-modal-question superset-workout-label" id="secondary-focus-label">Secondary Focus</p>
          <div class="app-selector" id="superset-secondary-focus-selector" data-selector-type="day2">
              <div class="selector-display">${getDaySummary(day2, "text-warning")}</div>
              <ul class="options-list">${createDayOptions(day2, day1)}</ul>
          </div>

          <div class="confirmation-modal-actions">
              <button class="action-button button-cancel" data-action="closeSupersetModal">Cancel</button>
              <button class="action-button button-log" data-action="confirmSuperset">Superset!</button>
          </div>
      </div>
    `;
}
