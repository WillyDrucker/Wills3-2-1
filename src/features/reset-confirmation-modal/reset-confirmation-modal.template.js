/* ==========================================================================
   RESET CONFIRMATION MODAL - HTML Template

   Generates reset confirmation modal HTML with backdrop, header, and action
   buttons. Uses superset-modal classes for consistent modal styling.

   Dependencies: None (pure template)
   Used by: reset-confirmation-modal.index.js (renderResetConfirmationModal)
   ========================================================================== */

export function getResetConfirmationModalTemplate() {
  return `
        <div class="superset-modal-backdrop" data-action="closeResetConfirmationModal"></div>
        <div class="superset-modal-content card">
            <h2 class="card-header">Reset Settings & Clear Logs?</h2>
            <div class="superset-modal-actions">
                <button class="action-button button-cancel" data-action="closeResetConfirmationModal">Cancel</button>
                <button class="action-button button-rest-skip" data-action="confirmReset">Yes - Reset</button>
            </div>
        </div>
      `;
}
