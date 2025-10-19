/* ==========================================================================
   APD/CLAUDE v5.5.5 - NEW WORKOUT MODAL TEMPLATE

   Generates new workout confirmation modal HTML.
   Triggered from workout-results-card "Begin Another Workout" button.

   Purpose:
   - Confirms previous workout saved to My Data with visual feedback
   - Warns user that starting new workout clears Today's Workout
   - Uses shared confirmation modal classes from _confirmation-modals.css
   - Provides green flash animation on "Workout saved to My Data!" text

   Architecture:
   - Uses shared classes: confirmation-modal-card, confirmation-modal-title, etc.
   - Custom classes: new-workout-card (for green Yes button and animation)
   - Static content (no dynamic logic like reset modal)
   - Green "Yes" button indicates confirmation action
   - saved-text-animate class triggers grow → snap → green flash animation

   Animation Flow:
   1. Text grows to 1.15x (matches workout log animation)
   2. Snaps back to 1x
   3. Flashes green with glow
   4. Stays green permanently

   Dependencies: None (pure template function)
   Used by: new-workout-modal.index.js (renderNewWorkoutModal)
   ========================================================================== */

/**
 * Generate new workout confirmation modal HTML template
 * @returns {string} HTML template string for new workout confirmation modal
 */
export function getNewWorkoutModalTemplate() {
  return `
        <div class="superset-modal-backdrop" data-action="closeNewWorkoutModal"></div>
        <div class="superset-modal-content card confirmation-modal-card new-workout-card">
            <h2 class="confirmation-modal-title">New Workout</h2>

            <p class="confirmation-modal-description saved-text-animate">
              Workout saved to My Data!
            </p>

            <p class="confirmation-modal-description">
              New Workout will reset workout settings to default and clear all logs.
            </p>

            <p class="confirmation-modal-question">
              Begin New Workout?
            </p>

            <div class="confirmation-modal-actions">
                <button class="action-button button-cancel" data-action="closeNewWorkoutModal">Cancel</button>
                <button class="action-button button-new-workout-yes" data-action="confirmNewWorkout">Yes</button>
            </div>
        </div>
      `;
}
