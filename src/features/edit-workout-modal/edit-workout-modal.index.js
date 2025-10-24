/* ==========================================================================
   EDIT WORKOUT MODAL - Business Logic

   Renders Edit Workout modal for editing completed workout sessions.
   Shows historical workout logs in editable format.

   Architecture:
   - Modal opens when clicking committed workout selector in My Data
   - Renders when appState.ui.activeModal === "editWorkout"
   - Stores selected workout ID in appState.ui.selectedWorkoutId
   - Provides handlers for cancel, delete, update actions

   Dependencies: appState, ui, modalService, getEditWorkoutModalTemplate
   Used by: actionHandlers.modals.js (modal actions), main.js (render pipeline)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getEditWorkoutModalTemplate } from "./edit-workout-modal.template.js";
import * as modalService from "services/ui/modalService.js";

/**
 * Render Edit Workout modal based on appState.ui.activeModal
 * Shows/hides modal and generates HTML template when active
 */
export function renderEditWorkoutModal() {
  const container = ui.editWorkoutModalContainer;
  if (!container) return;

  const isActive = appState.ui.activeModal === "editWorkout";
  container.classList.toggle("is-hidden", !isActive);

  if (isActive) {
    // Find the selected workout from history
    const workoutId = appState.ui.selectedWorkoutId;
    const workout = appState.user.history.workouts.find(
      (w) => w.id === workoutId
    );

    if (workout) {
      container.innerHTML = getEditWorkoutModalTemplate(workout);
    } else {
      console.error("Workout not found for Edit Workout modal:", workoutId);
      modalService.close();
    }
  } else {
    container.innerHTML = "";
  }
}
