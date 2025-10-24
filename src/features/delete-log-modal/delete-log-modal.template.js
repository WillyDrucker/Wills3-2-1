/* ==========================================================================
   DELETE LOG MODAL - HTML Template

   Generates Delete Log confirmation modal HTML with two variants:
   - Standard: Delete single log from multi-log workout
   - Last Log: Delete last log (removes entire workout)

   Architecture:
   - Confirmation modal pattern (backdrop + card)
   - Title: "Delete Log"
   - Dynamic description based on whether it's the last log
   - Buttons: Cancel, Yes (red button-rest-skip class)

   Dependencies: None (pure template function)
   Used by: delete-log-modal.index.js (renderDeleteLogModal)
   ========================================================================== */

/**
 * Generate Delete Log confirmation modal HTML
 * @param {boolean} isLastLog - Whether this is the last log in the workout
 * @returns {string} HTML template string for Delete Log modal
 */
export function getDeleteLogModalTemplate(isLastLog = false) {
  // Dynamic description based on last log status
  const descriptionHtml = isLastLog
    ? `<p class="confirmation-modal-description">
         Deleting this log is permanent!
       </p>
       <p class="confirmation-modal-description">
         This is the last log in this workout.
       </p>
       <p class="confirmation-modal-description">
         The entire workout will be removed.
       </p>`
    : `<p class="confirmation-modal-description">
         Deleting a log is permanent!
       </p>
       <p class="confirmation-modal-description">
         This action cannot be undone.
       </p>`;

  return `
    <div class="superset-modal-backdrop" data-action="closeDeleteLogModal"></div>
    <div class="superset-modal-content card confirmation-modal-card delete-log-card">
      <h2 class="confirmation-modal-title">Delete Log</h2>

      ${descriptionHtml}

      <div class="confirmation-modal-actions">
        <button class="action-button button-cancel" data-action="closeDeleteLogModal">Cancel</button>
        <button class="action-button button-rest-skip" data-action="confirmDeleteLog">Yes</button>
      </div>
    </div>
  `;
}
