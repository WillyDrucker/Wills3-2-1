/* ==========================================================================
   EDIT WORKOUT MODAL - Business Logic

   Renders Edit Workout modal for editing completed workout sessions.
   Shows historical workout logs in editable format.

   Architecture:
   - Modal opens when clicking committed workout selector in My Data
   - Renders when appState.ui.activeModal === "editWorkout"
   - Stores selected workout ID in appState.ui.selectedWorkoutId
   - Provides handlers for cancel, delete, update actions
   - Supports modal stacking: stays visible (muted) when child modals open
   - Child modals: Delete Log, Delete Workout, Cancel Changes

   Modal Stacking Behavior:
   - When Edit Workout is active: shown normally
   - When child modal is active: shown muted (opacity 0.5, no pointer events)
   - Child modals have z-index: 1100, Edit Workout has z-index: 1000
   - Creates visual hierarchy: My Data < Edit Workout (muted) < Child modal

   Dependencies: appState, ui, modalService, getEditWorkoutModalTemplate
   Used by: actionHandlers.modals.js (modal actions), main.js (render pipeline)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getEditWorkoutModalTemplate } from "./edit-workout-modal.template.js";
import * as modalService from "services/ui/modalService.js";

// Child modals that stack on top of Edit Workout modal
const CHILD_MODALS = ["deleteLog", "deleteWorkout", "cancelChanges"];

/**
 * Render Edit Workout modal based on appState.ui.activeModal
 * Shows/hides modal and generates HTML template when active or when child modal is active
 * Applies muted state when child modal is open for better visual hierarchy
 */
export function renderEditWorkoutModal() {
  const container = ui.editWorkoutModalContainer;
  if (!container) return;

  const activeModal = appState.ui.activeModal;
  const isActive = activeModal === "editWorkout";
  const isChildModalActive = CHILD_MODALS.includes(activeModal);
  const shouldShow = isActive || isChildModalActive;

  // Hide modal only if neither Edit Workout nor its children are active
  container.classList.toggle("is-hidden", !shouldShow);

  // Apply muted state when child modal is active
  container.classList.toggle("is-parent-modal-muted", isChildModalActive);

  if (shouldShow) {
    // Find the selected workout from history
    const workoutId = appState.ui.selectedWorkoutId;

    // Guard against null/undefined workout ID
    if (!workoutId) {
      container.innerHTML = "";
      return;
    }

    const workout = appState.user.history.workouts.find(
      (w) => w.id === workoutId
    );

    if (workout) {
      container.innerHTML = getEditWorkoutModalTemplate(workout);

      // Force-clear any browser-cached input values to prevent stale data
      // This fixes a bug where browser autocomplete would repopulate deleted log inputs
      requestAnimationFrame(() => {
        container.querySelectorAll('input[type="number"]').forEach(input => {
          const expectedValue = input.getAttribute('value');
          const actualValue = input.value;

          if (actualValue !== expectedValue) {
            input.value = expectedValue;
          }
        });
      });

      // Clear selector-open class after re-render to prevent orphaned muting
      // When a details element is destroyed during re-render, its open state is lost
      // but the body class persists, causing CSS muting on all closed panels
      document.body.classList.remove('is-selector-open');

      // Set up event listeners for edit panel details elements
      const editPanels = container.querySelectorAll('.edit-log-item');

      // Track which panel is currently open for two-step behavior
      let currentlyOpenPanel = null;

      editPanels.forEach(panel => {
        // Toggle event fires when panel opens/closes
        panel.addEventListener('toggle', (event) => {
          if (event.target.open) {
            // Panel opened - add body class and close other panels
            editPanels.forEach(otherPanel => {
              if (otherPanel !== event.target) {
                otherPanel.open = false;
              }
            });
            currentlyOpenPanel = event.target;
            document.body.classList.add('is-selector-open');
          } else {
            // Panel closed - remove body class
            if (currentlyOpenPanel === event.target) {
              currentlyOpenPanel = null;
            }
            document.body.classList.remove('is-selector-open');
          }
        });

        // Two-step behavior: clicking summary when another panel is open should close it first
        const summary = panel.querySelector('summary');
        if (summary) {
          summary.addEventListener('click', (event) => {
            // If a different panel is open, close it and prevent this panel from opening
            if (currentlyOpenPanel && currentlyOpenPanel !== panel && !panel.open) {
              event.preventDefault(); // Prevent panel from opening
              currentlyOpenPanel.open = false; // Close the currently open panel
              currentlyOpenPanel = null;
            }
          }, true); // Capture phase to run before default behavior
        }
      });
    } else {
      console.error("Workout not found for Edit Workout modal:", workoutId);
      modalService.close();
    }
  } else {
    container.innerHTML = "";
    // Clear selector-open class when modal is hidden
    document.body.classList.remove('is-selector-open');
  }
}
