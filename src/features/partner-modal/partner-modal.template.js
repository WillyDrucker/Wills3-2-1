/* ==========================================================================
   PARTNER MODAL - HTML Template

   Generates partner modal HTML with two user day selectors (green/blue scheme).
   Displays user profiles and workout day selection. Today appears first in day
   options, filters out rest days.

   Dependencies: appState (weeklyPlan, todayDayName, partner)
   Used by: partner-modal.index.js (renderPartnerModal)
   ========================================================================== */

import { appState } from "state";

function createDayOptions(currentSelection) {
  const today = appState.todayDayName;
  const allDays = Object.keys(appState.weeklyPlan).filter(
    (day) => appState.weeklyPlan[day]?.title !== "Rest"
  );

  const orderedDays = [];
  if (allDays.includes(today) && today !== currentSelection) {
    orderedDays.push(today);
  }

  allDays.forEach((day) => {
    if (day !== currentSelection && day !== today) {
      orderedDays.push(day);
    }
  });

  return orderedDays
    .map((day) => {
      const workout = appState.weeklyPlan[day];
      if (!workout) return "";
      const dayColorClass = day === today ? "text-plan" : "text-deviation";
      const dayDisplay = `${workout.title} (${workout.type})`;
      return `<li data-day="${day}"><div class="item-main-line truncate-text">${day}: <span class="data-highlight ${dayColorClass}">${dayDisplay}</span></div></li>`;
    })
    .join("");
}

function getDaySummary(selectedDay, colorClass) {
  if (!selectedDay) return `<div class="selector-content">...</div>`;
  const info = appState.weeklyPlan[selectedDay];
  if (!info) return `<div class="selector-content">...</div>`;
  const display =
    info.title === "Rest" ? info.title : `${info.title} (${info.type})`;
  return `<div class="selector-content"><div class="item-main-line truncate-text">${selectedDay}: <span class="data-highlight ${colorClass}" data-animation-target="true">${display}</span></div></div>`;
}

export function getPartnerModalTemplate() {
  const { user1Day, user2Day, user1Name, user2Name } = appState.partner;

  return `
    <div class="superset-modal-backdrop" data-action="closePartnerModal"></div>
    <div class="superset-modal-content card">
        <h2 class="card-header">Current User</h2>
        <details class="app-selector is-muted">
            <summary>
                <div class="selector-content">
                    <div class="item-main-line">
                        <span class="text-on-surface-medium">Profile: </span>
                        <span class="data-highlight text-plan">${user1Name}</span>
                    </div>
                </div>
            </summary>
            <ul class="options-list"></ul>
        </details>

        <h2 class="card-header with-header">Current User Focus</h2>
        <details class="app-selector" id="partner-user1-day-selector">
            <summary>${getDaySummary(user1Day, "text-plan")}</summary>
            <ul class="options-list">
              ${createDayOptions(user1Day)}
            </ul>
        </details>

        <div class="modal-divider"></div>

        <h2 class="card-header with-header">Partner</h2>
        <details class="app-selector is-muted">
            <summary>
                <div class="selector-content">
                    <div class="item-main-line">
                        <span class="text-on-surface-medium">Profile: </span>
                        <span class="data-highlight text-primary">${user2Name}</span>
                    </div>
                </div>
            </summary>
            <ul class="options-list"></ul>
        </details>

        <h2 class="card-header with-header">Partner Focus</h2>
        <details class="app-selector" id="partner-user2-day-selector">
            <summary>${getDaySummary(user2Day, "text-primary")}</summary>
            <ul class="options-list">
              ${createDayOptions(user2Day)}
            </ul>
        </details>

        <div class="superset-modal-actions">
            <button class="action-button button-cancel" data-action="closePartnerModal">Cancel</button>
            <button class="action-button button-primary" data-action="confirmPartnerWorkout">Partner Up!</button>
        </div>
    </div>
  `;
}
