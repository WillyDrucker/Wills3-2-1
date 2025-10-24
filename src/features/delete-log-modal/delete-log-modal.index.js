/* ==========================================================================
   DELETE LOG MODAL - Business Logic

   Renders Delete Log confirmation modal for removing historical workout logs.
   Shows different messages for standard delete vs last-log delete.

   Architecture:
   - Modal opens when clicking "Delete" in Edit Workout edit panel
   - Renders when appState.ui.activeModal === "deleteLog"
   - Stores log info in appState.ui.deleteLogContext
   - Checks if log is last in workout to show appropriate message

   Dependencies: appState, ui, modalService, getDeleteLogModalTemplate
   Used by: actionHandlers.modals.js (modal actions), main.js (render pipeline)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getDeleteLogModalTemplate } from "./delete-log-modal.template.js";

/**
 * Render Delete Log confirmation modal based on appState.ui.activeModal
 * Shows/hides modal and generates HTML template when active
 */
export function renderDeleteLogModal() {
  const container = ui.deleteLogModalContainer;
  if (!container) return;

  const isActive = appState.ui.activeModal === "deleteLog";
  container.classList.toggle("is-hidden", !isActive);

  if (isActive) {
    const context = appState.ui.deleteLogContext;
    if (!context) {
      console.error("Delete log context not found");
      return;
    }

    // Find the workout to check if this is the last log
    const workout = appState.user.history.workouts.find(
      (w) => w.id === context.workoutId
    );

    const isLastLog = workout ? workout.logs.length === 1 : false;

    container.innerHTML = getDeleteLogModalTemplate(isLastLog);
  } else {
    container.innerHTML = "";
  }
}
