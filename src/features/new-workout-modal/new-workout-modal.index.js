/* ==========================================================================
   NEW WORKOUT MODAL - Business Logic

   Business logic for new workout confirmation modal.
   Shown after workout completion when user clicks "Begin Another Workout".

   Purpose:
   - Renders modal when appState.ui.activeModal === "newWorkout"
   - Handles modal visibility toggle with is-hidden class
   - Provides handleConfirmNewWorkout callback for Yes button
   - Closes modal when user confirms or cancels

   Flow:
   1. User completes workout (workout-results-card shows "Begin Another Workout")
   2. User clicks "Begin Another Workout" → actionHandlers.openNewWorkoutModal()
   3. renderNewWorkoutModal() shows modal with animation
   4. User clicks "Yes" → actionHandlers.confirmNewWorkout() → coreActions.resetSessionAndLogs()
   5. Modal closes, Today's Workout resets, previous workout preserved in My Data

   Dependencies:
   - appState: Global state management (ui.activeModal)
   - ui: DOM element references (newWorkoutModalContainer)
   - modalService: Modal open/close utilities
   - getNewWorkoutModalTemplate: HTML template generator

   Used by:
   - actionHandlers.js: openNewWorkoutModal, confirmNewWorkout actions
   - main.js: renderNewWorkoutModal() in render pipeline
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getNewWorkoutModalTemplate } from "./new-workout-modal.template.js";
import * as modalService from "services/ui/modalService.js";

/**
 * Handle new workout confirmation
 * Closes modal - actual reset handled by actionHandlers.confirmNewWorkout
 */
export function handleConfirmNewWorkout() {
  modalService.close();
}

/**
 * Render new workout confirmation modal based on appState.ui.activeModal
 * Shows/hides modal and generates HTML template when active
 */
export function renderNewWorkoutModal() {
  const container = ui.newWorkoutModalContainer;
  if (container) {
    container.classList.toggle(
      "is-hidden",
      appState.ui.activeModal !== "newWorkout"
    );
    if (appState.ui.activeModal === "newWorkout") {
      container.innerHTML = getNewWorkoutModalTemplate();
    } else {
      container.innerHTML = "";
    }
  }
}
