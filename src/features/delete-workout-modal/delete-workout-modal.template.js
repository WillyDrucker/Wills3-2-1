/* ==========================================================================
   DELETE WORKOUT MODAL - HTML Template

   Confirmation modal for deleting entire workout session.
   Warns user that action is permanent and cannot be undone.

   Architecture:
   - Confirmation modal pattern (backdrop + card)
   - Title: "Delete Workout"
   - Warning text with red grow-flash animation
   - Cancel button (regular) + Yes button (red)

   Dependencies: None
   Used by: delete-workout-modal.index.js (renderDeleteWorkoutModal)
   ========================================================================== */

export function getDeleteWorkoutModalTemplate() {
  return `
    <div class="superset-modal-backdrop" data-action="cancelDeleteWorkout"></div>
    <div class="superset-modal-content card confirmation-modal-card delete-workout-card">
      <h2 class="confirmation-modal-title">Delete Workout</h2>

      <p class="confirmation-modal-description">Deletes all logs and removes workout.</p>

      <p class="confirmation-modal-description permanent-warning-text">This action is permanent and can't be undone!</p>

      <div class="confirmation-modal-action-group">
        <button class="confirmation-modal-action-button button-cancel" data-action="cancelDeleteWorkout">Cancel</button>
        <button class="confirmation-modal-action-button button-delete-yes" data-action="confirmDeleteWorkout">Yes</button>
      </div>
    </div>
  `;
}
