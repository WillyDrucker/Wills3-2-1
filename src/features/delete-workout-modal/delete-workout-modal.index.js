/* ==========================================================================
   DELETE WORKOUT MODAL - Business Logic

   Renders Delete Workout modal for confirming deletion of entire workout session.
   Shows warning that action is permanent and cannot be undone.

   Architecture:
   - Modal opens when clicking "Delete All" button in Edit Workout modal
   - Renders when appState.ui.activeModal === "deleteWorkout"
   - Uses selectedWorkoutId from appState
   - Provides handlers for cancel and confirm actions

   Dependencies: appState, ui, getDeleteWorkoutModalTemplate
   Used by: actionHandlers.modals.js (modal actions), main.js (render pipeline)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getDeleteWorkoutModalTemplate } from "./delete-workout-modal.template.js";

/**
 * Render Delete Workout modal based on appState.ui.activeModal
 * Shows/hides modal and generates HTML template when active
 */
export function renderDeleteWorkoutModal() {
  const container = ui.deleteWorkoutModalContainer;
  if (!container) return;

  const isActive = appState.ui.activeModal === "deleteWorkout";
  container.classList.toggle("is-hidden", !isActive);

  if (isActive) {
    container.innerHTML = getDeleteWorkoutModalTemplate();
  } else {
    container.innerHTML = "";
  }
}
