/* ==========================================================================
   RESET CONFIRMATION MODAL - HTML Template

   Generates dynamic reset confirmation modal HTML based on logged sets count.
   Triggered from config-card Reset button.

   Purpose:
   - Provides context-aware confirmation before resetting workout settings
   - Protects users from accidental data loss by showing logged sets count
   - Offers "Save My Data" option when logs exist to preserve workout before reset
   - Uses shared confirmation modal classes from _confirmation-modals.css

   Dynamic Logic:
   0 sets logged:
   - Simple reset message with 2 buttons (Cancel/Yes)
   - No warning needed since there are no logs to clear
   - Question: "Reset Settings?"

   1+ sets logged:
   - Warning about clearing logs with green highlighted count
   - 3 buttons (Cancel/Save My Data/Yes)
   - Question: "Reset Settings & Clear Logs?"

   Architecture:
   - Uses shared classes: confirmation-modal-card, confirmation-modal-title, etc.
   - Custom classes: reset-confirmation-card (for button-reset-save-mydata styling)
   - Template strings with conditional rendering for dynamic content

   Dependencies: None (pure template function)
   Used by: reset-confirmation-modal.index.js (renderResetConfirmationModal)
   ========================================================================== */

/**
 * Generate reset confirmation modal HTML template
 * @param {number} loggedSetsCount - Number of logged exercise sets in current workout
 * @returns {string} HTML template string for reset confirmation modal
 */
export function getResetConfirmationModalTemplate(loggedSetsCount = 0) {
  // Determine description text based on logged sets
  const descriptionText = loggedSetsCount === 0
    ? "Reset workout settings to default.<br>Workout history in My Data will be saved."
    : "Reset workout settings to default and clear Today's Workout logs.";

  // Determine count warning text
  const countWarningText = loggedSetsCount === 0
    ? ""
    : loggedSetsCount === 1
    ? 'There is <span style="color: var(--log-green)">1</span> exercise set logged!'
    : `There are <span style="color: var(--log-green)">${loggedSetsCount}</span> exercise sets logged!`;

  // Determine question text based on logged sets
  const questionText = loggedSetsCount === 0
    ? "Reset Settings?"
    : "Reset Settings & Clear Logs?";

  // Determine button layout based on logged sets
  const buttonGroup = loggedSetsCount === 0
    ? `<div class="confirmation-modal-actions">
                <button class="action-button button-cancel" data-action="closeResetConfirmationModal">Cancel</button>
                <button class="action-button button-rest-skip" data-action="confirmReset">Yes</button>
            </div>`
    : `<div class="confirmation-modal-actions confirmation-modal-actions-three">
                <button class="action-button button-cancel" data-action="closeResetConfirmationModal">Cancel</button>
                <button class="action-button button-reset-save-mydata" data-action="saveMyDataAndReset">
                    <span class="button-save-line1">Save</span>
                    <span class="button-save-line2">My Data</span>
                </button>
                <button class="action-button button-rest-skip" data-action="confirmReset">Yes</button>
            </div>`;

  return `
        <div class="superset-modal-backdrop" data-action="closeResetConfirmationModal"></div>
        <div class="superset-modal-content card confirmation-modal-card reset-confirmation-card">
            <h2 class="confirmation-modal-title">Reset</h2>

            <p class="confirmation-modal-description">
              ${descriptionText}
            </p>

            ${countWarningText ? `<p class="confirmation-modal-warning">${countWarningText}</p>` : ''}

            <p class="confirmation-modal-question">
              ${questionText}
            </p>

            ${buttonGroup}
        </div>
      `;
}
