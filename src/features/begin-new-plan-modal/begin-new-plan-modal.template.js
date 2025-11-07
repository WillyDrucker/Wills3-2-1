/* ==========================================================================
   BEGIN NEW PLAN MODAL - Template

   Generates confirmation modal for beginning a new training plan.
   Informs user that plan progress will be saved to My Data and reset.

   Modal Structure:
   - Title: "New Plan"
   - Success message (green animation, no glow): "Progress has been saved to My Data!"
   - Description: Current Plan reset to Week 1 with full plan name (7px spacing)
   - Question: "Begin New Plan?"
   - Actions: Cancel | Yes (green button)

   Text Example: "Current Plan will reset to Week 1 of Will's 3-2-1: 15 Weeks."
   Color Scheme: "Week 1" (green), "Will's 3-2-1:" (gray), "15 Weeks" (green)

   Dependencies: appState
   Used by: begin-new-plan-modal.index.js
   ========================================================================== */

import { appState } from "state";

/* === TEMPLATE GENERATION === */

/**
 * Generate Begin New Plan modal HTML
 * @returns {string} Modal HTML with backdrop, content, and action buttons
 */
export function getBeginNewPlanModalTemplate() {
  const { selectedPlanId } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  // Find selected plan to get total weeks
  const selectedPlan = plans && plans.length > 0
    ? plans.find((p) => p.id === selectedPlanId)
    : null;

  const planName = selectedPlanId || "this plan";
  const totalWeeks = selectedPlan?.totalWeeks || 0;
  const weeksText = totalWeeks === 1 ? "Week" : "Weeks";

  return `
    <div class="superset-modal-backdrop" data-action="closeBeginNewPlanModal"></div>
    <div class="superset-modal-content card confirmation-modal-card begin-new-plan-card">
        <h2 class="confirmation-modal-title">New Plan</h2>

        <p class="confirmation-modal-description modal-text-animated">Progress has been saved to My Data!</p>

        <p class="confirmation-modal-description modal-spacing-top">Current Plan will reset to <span class="text-plan">Week 1</span> of <span class="text-info">${planName}:</span> <span class="text-plan">${totalWeeks} ${weeksText}</span>.</p>

        <p class="confirmation-modal-question">Begin New Plan?</p>

        <div class="confirmation-modal-actions">
            <button class="action-button button-cancel" data-action="closeBeginNewPlanModal">Cancel</button>
            <button class="action-button button-begin-new-plan-yes" data-action="confirmBeginNewPlan">Yes</button>
        </div>
    </div>
  `;
}
