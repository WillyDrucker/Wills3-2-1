/* ==========================================================================
   RESUME PLAN MODAL - Main Controller

   Controls Resume Plan confirmation modal rendering and visibility.
   Modal appears when user selects a plan with logged workouts in last 2 weeks.

   Modal Flow:
   1. User selects a different plan in My Plan dropdown
   2. System detects plan has logged workouts in last 2 weeks
   3. Modal opens asking if user wants to resume at current week or start fresh
   4. User clicks "Yes" → resume plan at calculated week number
   5. User clicks "No" → start fresh at Week 1, mark old plan as 'switched'
   6. User clicks "Cancel" or backdrop → modal closes, no changes

   Dependencies: appState, ui, getResumePlanModalHTML
   Used by: Main render pipeline (main.js)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getResumePlanModalHTML } from "./resume-plan-modal.template.js";

/**
 * Render Resume Plan modal
 * Shows/hides modal container based on appState.ui.activeModal
 * Generates fresh HTML when modal opens to ensure current plan information
 */
export function renderResumePlanModal() {
  const container = ui.resumePlanModalContainer;
  if (container) {
    container.classList.toggle(
      "is-hidden",
      appState.ui.activeModal !== "resumePlan"
    );
    if (appState.ui.activeModal === "resumePlan") {
      container.innerHTML = getResumePlanModalHTML();
    } else {
      container.innerHTML = "";
    }
  }
}
