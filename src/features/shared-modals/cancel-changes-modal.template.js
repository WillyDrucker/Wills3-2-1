/* ==========================================================================
   CANCEL CHANGES MODAL - HTML Template

   Generic confirmation modal for canceling unsaved changes.
   Warns user that changes will be discarded.

   Architecture:
   - Confirmation modal pattern (backdrop + card)
   - Title: "Cancel"
   - Question text: "Discard all changes and Cancel?"
   - No button (regular Cancel button color) + Yes button (red)

   Dependencies: None
   Used by: cancel-changes-modal.index.js (renderCancelChangesModal)
   ========================================================================== */

export function getCancelChangesModalTemplate() {
  return `
    <div class="superset-modal-backdrop" data-action="declineCancelChanges"></div>
    <div class="superset-modal-content card confirmation-modal-card cancel-changes-card">
      <h2 class="confirmation-modal-title">Cancel</h2>

      <p class="confirmation-modal-description">All changes will be lost.</p>

      <p class="confirmation-modal-question">Discard all changes?</p>

      <div class="confirmation-modal-actions">
        <button class="action-button button-cancel" data-action="declineCancelChanges">No</button>
        <button class="action-button button-cancel-yes" data-action="confirmCancelChanges">Yes</button>
      </div>
    </div>
  `;
}
