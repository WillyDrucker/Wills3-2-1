/* ==========================================================================
   BEGIN NEW PLAN MODAL - Main Controller

   Controls Begin New Plan confirmation modal rendering and visibility.
   Modal appears when user clicks "Begin New Plan" button on My Plan page.

   Modal Flow:
   1. User selects different plan in My Plan dropdown
   2. User clicks "Begin New Plan" button
   3. Modal opens with warning about progress loss
   4. User clicks "Yes" → plan activates, resets to Week 1, archives old plan
   5. User clicks "Cancel" or backdrop → modal closes, no changes

   Dependencies: appState, ui, getBeginNewPlanModalTemplate
   Used by: Main render pipeline (main.js)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getBeginNewPlanModalTemplate } from "./begin-new-plan-modal.template.js";

/**
 * Render Begin New Plan modal
 * Shows/hides modal container based on appState.ui.activeModal
 * Generates fresh HTML when modal opens to ensure current plan name
 */
export function renderBeginNewPlanModal() {
  const container = ui.beginNewPlanModalContainer;
  if (container) {
    container.classList.toggle(
      "is-hidden",
      appState.ui.activeModal !== "beginNewPlan"
    );
    if (appState.ui.activeModal === "beginNewPlan") {
      container.innerHTML = getBeginNewPlanModalTemplate();
    } else {
      container.innerHTML = "";
    }
  }
}
