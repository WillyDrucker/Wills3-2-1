/* ==========================================================================
   RESET MODAL - HTML Template

   Confirmation modal for reset operations with three stacked action buttons.
   Displayed when non-dev users click "Reset" in side navigation.

   Architecture: Fullscreen modal overlay with centered card
   - Title: "Reset" (2.5rem - matches "Will's 3-2-1")
   - 3 vertically stacked buttons with 16px spacing
   - Green: Reset Workout Defaults (disabled if sets logged)
   - Yellow: Reset Workout Defaults & Clear Logs
   - Red: Clear My Data

   Dependencies: None (pure template)
   Used by: reset-modal.index.js
   ========================================================================== */

export function getResetModalTemplate(hasLoggedSets) {
  return `
    <div class="reset-options-modal-overlay" data-action="closeResetOptionsModal">
      <div class="reset-options-modal-content card">
        <h2 class="reset-options-modal-title">Reset</h2>

        <button
          type="button"
          class="action-button button-reset-defaults"
          data-action="resetWorkoutDefaults"
          ${hasLoggedSets ? 'disabled' : ''}
        >
          Reset Workout Defaults
        </button>

        <button
          type="button"
          class="action-button button-reset-and-clear"
          data-action="resetWorkoutAndClearLogs"
        >
          <span>Reset Workout Defaults &</span>
          <span>Clear Logs</span>
        </button>

        <button
          type="button"
          class="action-button button-clear-data"
          data-action="clearMyData"
        >
          Clear My Data
        </button>
      </div>
    </div>
  `;
}
