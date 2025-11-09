/* ==========================================================================
   RESUME PLAN MODAL - Template

   Informational modal for resuming a previously started plan.
   Triggered when user selects a plan that has logged workouts in the last 2 weeks.

   Buttons:
   - Cancel: Close modal, no changes
   - Yes: Resume at the week they left off at (update existing plan_progress)

   Dependencies: appState, _confirmation-modals.css, resume-plan-modal.style.css
   Used by: actionHandlers.modals.js (showResumePlanModal)
   ========================================================================== */

import { appState } from "state";

/* === MODAL GENERATION === */

/**
 * Generate Resume Plan modal HTML
 * Triggered when selecting a plan with recent workouts
 */
export function getResumePlanModalHTML() {
  // Get the plan information from modal context
  const { planName, planDurationWeeks, currentWeekNumber } = appState.ui.resumePlanModalContext || {};

  if (!planName) {
    return `<div class="superset-modal-backdrop"></div>
            <div class="superset-modal-content card confirmation-modal-card">
              <p>Error: Plan information not found.</p>
            </div>`;
  }

  const weeksText = planDurationWeeks === 1 ? "Week" : "Weeks";

  return `<div class="superset-modal-backdrop" data-action="closeResumePlanModal"></div>
    <div class="superset-modal-content card confirmation-modal-card resume-plan-card">
      <h2 class="confirmation-modal-title">Resume Plan</h2>

      <p class="confirmation-modal-description">Plan will resume:</p>

      <p class="confirmation-modal-description modal-spacing-reduced">
        <span class="text-plan">Week ${currentWeekNumber}</span> of
        <span class="text-info">${planName}:</span>
        <span class="text-plan">${planDurationWeeks} ${weeksText}</span>.
      </p>

      <p class="confirmation-modal-question">Resume?</p>

      <div class="confirmation-modal-actions">
        <button class="action-button button-cancel"
                data-action="closeResumePlanModal">Cancel</button>
        <button class="action-button button-resume-yes"
                data-action="resumePlanYes">Yes</button>
      </div>
    </div>
  </div>`;
}
