/* ==========================================================================
   CANCEL CHANGES MODAL - HTML Template

   Generic confirmation modal for canceling unsaved changes.
   Warns user that changes will be discarded.

   Architecture:
   - Confirmation modal pattern (backdrop + card)
   - Title: "Cancel"
   - Description: "There are # changes. All changes will be lost." (# in green)
   - Question text: "Discard all changes?"
   - No button (regular Cancel button color) + Yes button (red)

   Dependencies: appState (for changeCount)
   Used by: cancel-changes-modal.index.js (renderCancelChangesModal)
   ========================================================================== */

import { appState } from "state";

export function getCancelChangesModalTemplate() {
  const changeCount = appState.ui.editWorkout.changeCount || 0;
  const changeText = changeCount === 1 ? "change" : "changes";

  return `
    <div class="superset-modal-backdrop" data-action="declineCancelChanges"></div>
    <div class="superset-modal-content card confirmation-modal-card cancel-changes-card">
      <h2 class="confirmation-modal-title">Cancel</h2>

      <p class="confirmation-modal-description">There ${changeCount === 1 ? 'is' : 'are'} <span class="text-success">${changeCount}</span> ${changeText}. All changes will be lost.</p>

      <p class="confirmation-modal-question">Discard all changes?</p>

      <div class="confirmation-modal-actions">
        <button class="action-button button-cancel" data-action="declineCancelChanges">No</button>
        <button class="action-button button-cancel-yes" data-action="confirmCancelChanges">Yes</button>
      </div>
    </div>
  `;
}
