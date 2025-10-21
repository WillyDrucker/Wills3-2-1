/* ==========================================================================
   PARTNER MODAL TEMPLATE

   Generates partner modal HTML with two user day selectors (green/blue scheme).
   Triggered from config-card Partner button.

   Purpose:
   - Displays two user profiles with workout day selection
   - Green scheme for current user (User 1)
   - Blue scheme for partner (User 2)
   - Uses shared confirmation modal classes from _confirmation-modals.css

   Architecture:
   - Title: "Partner" (uses confirmation-modal-title) → 16px space
   - "Current User Profile" label (uses confirmation-modal-question, 1.25rem/600, left-aligned) → 7px space
   - User 1 Profile: Green text (text-plan), muted selector (read-only display) → 16px space
   - "Current User Focus" label (uses confirmation-modal-question, 1.25rem/600, left-aligned) → 7px space
   - User 1 Focus: Green text highlight, active day selector → 16px space
   - Divider: Visual separation between users (modal-divider) → 16px space
   - "Partner Profile" label (uses confirmation-modal-question, 1.25rem/600, left-aligned) → 7px space
   - Partner Profile: Blue text (text-primary), muted selector (read-only display) → 16px space
   - "Partner Focus" label (uses confirmation-modal-question, 1.25rem/600, left-aligned) → 7px space
   - Partner Focus: Blue text highlight, active day selector → 16px space
   - Button group: Cancel/Partner Up! (uses confirmation-modal-actions)

   Day Options Logic:
   - Today appears first if available
   - Filters out rest days
   - Today shows as green (text-plan)
   - Other days show as olive (text-deviation)
   - Each user can select any non-rest day independently
   - Selector displays have data-animation-target attribute for animations

   Dependencies: appState (weeklyPlan, todayDayName, partner.user1Day, partner.user2Day, auth.user.nickname, auth.user.email)
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
      return `<li data-day="${day}"><div class="item-main-line flex-line-container"><span class="flex-priority text-info">${day}:&nbsp;</span><span class="truncate-text data-highlight ${dayColorClass}">${dayDisplay}</span></div></li>`;
    })
    .join("");
}

function getDaySummary(selectedDay, colorClass) {
  if (!selectedDay) return `<div class="selector-content">...</div>`;
  const info = appState.weeklyPlan[selectedDay];
  if (!info) return `<div class="selector-content">...</div>`;
  const display =
    info.title === "Rest" ? info.title : `${info.title} (${info.type})`;
  return `<div class="selector-content"><div class="item-main-line flex-line-container"><span class="flex-priority text-info">${selectedDay}:&nbsp;</span><span class="truncate-text data-highlight ${colorClass}" data-animation-target="true">${display}</span></div></div>`;
}

export function getPartnerModalTemplate() {
  const { user1Day, user2Day } = appState.partner;

  // Get current user display name (nickname or email)
  const currentUserName = appState.auth?.user?.nickname || appState.auth?.user?.email || "User";
  const partnerUserName = "Guest";

  return `
    <div class="superset-modal-backdrop" data-action="closePartnerModal"></div>
    <div class="superset-modal-content card confirmation-modal-card partner-card">
        <h2 class="confirmation-modal-title">Partner</h2>

        <p class="confirmation-modal-question">Current User Profile</p>
        <details class="app-selector is-muted" id="partner-user1-profile-selector">
            <summary>
                <div class="selector-content">
                    <span class="truncate-text text-on-surface-medium">Profile:</span>
                    <span class="truncate-text data-highlight text-plan">${currentUserName}</span>
                </div>
            </summary>
            <ul class="options-list"></ul>
        </details>

        <p class="confirmation-modal-question partner-section-label" id="current-user-focus-label">Current User Focus</p>
        <div class="app-selector" id="partner-user1-day-selector" data-selector-type="user1Day">
            <div class="selector-display">${getDaySummary(user1Day, "text-plan")}</div>
            <ul class="options-list">
              ${createDayOptions(user1Day)}
            </ul>
        </div>

        <div class="modal-divider"></div>

        <p class="confirmation-modal-question partner-section-label">Partner Profile</p>
        <details class="app-selector is-muted" id="partner-user2-profile-selector">
            <summary>
                <div class="selector-content">
                    <span class="truncate-text text-on-surface-medium">Profile:</span>
                    <span class="truncate-text data-highlight text-primary">${partnerUserName}</span>
                </div>
            </summary>
            <ul class="options-list"></ul>
        </details>

        <p class="confirmation-modal-question partner-section-label" id="partner-focus-label">Partner Focus</p>
        <div class="app-selector" id="partner-user2-day-selector" data-selector-type="user2Day">
            <div class="selector-display">${getDaySummary(user2Day, "text-primary")}</div>
            <ul class="options-list">
              ${createDayOptions(user2Day)}
            </ul>
        </div>

        <div class="confirmation-modal-actions">
            <button class="action-button button-cancel" data-action="closePartnerModal">Cancel</button>
            <button class="action-button button-primary" data-action="confirmPartnerWorkout">Partner Up!</button>
        </div>
    </div>
  `;
}
