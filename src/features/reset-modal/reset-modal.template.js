/* ==========================================================================
   RESET MODAL - HTML Template

   Confirmation modal for reset operations with three stacked action buttons.
   Displayed when non-dev users click "Reset" in side navigation.

   Architecture: Fullscreen modal overlay with centered card
   - Title: "Reset" (2.5rem - matches Reset Password page)
   - Description: Explains consequence of reset action (1rem, 600 weight)
   - Question: "Reset Settings & Clear Logs?" (1rem, 400 weight)
   - 16px spacing rhythm throughout (title → description → question → buttons)
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

        <p class="reset-options-modal-description">
          This will reset workout settings to default and clear all of Today's Workout logs.
        </p>

        <p class="reset-options-modal-question">
          Reset Settings & Clear Logs?
        </p>

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
