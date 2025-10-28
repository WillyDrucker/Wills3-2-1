/* ==========================================================================
   DELETE WORKOUT MODAL - HTML Template

   Confirmation modal for deleting entire workout session.
   Warns user that action is permanent and cannot be undone.

   Architecture:
   - Confirmation modal pattern (backdrop + card)
   - Title: "Delete Workout"
   - Warning text with red grow-flash animation
   - Cancel button (regular) + Yes button (red button-rest-skip)

   Dependencies: None
   Used by: delete-workout-modal.index.js (renderDeleteWorkoutModal)
   ========================================================================== */

export function getDeleteWorkoutModalTemplate() {
  return `
    <div class="superset-modal-backdrop" data-action="cancelDeleteWorkout"></div>
    <div class="superset-modal-content card confirmation-modal-card delete-workout-card">
      <h2 class="confirmation-modal-title">Delete Workout</h2>

      <p class="confirmation-modal-description modal-text-animated">This action is permanent and can't be undone!</p>

      <p class="confirmation-modal-question">Delete Entire Workout?</p>

      <div class="confirmation-modal-actions">
        <button class="action-button button-cancel" data-action="cancelDeleteWorkout">Cancel</button>
        <button class="action-button button-rest-skip" data-action="confirmDeleteWorkout">Yes</button>
      </div>
    </div>
  `;
}
