/* ==========================================================================
   WORKOUT RESULTS CARD - HTML Template

   Generates workout completion card HTML with plate animations, results
   summary, and two action buttons.

   Architecture:
   - "Workout Complete!" text (static, centered with plates)
   - "Begin Another Workout" button (blue, enabled immediately)
   - "My Data" button (green, shows "Workout Saved!" during animation, then "My Data")

   Dependencies: appState, workoutMetricsService
   Used by: workout-results-card.index.js (renderWorkoutResultsCard)
   ========================================================================== */

import { appState } from "state";
import * as workoutMetricsService from "services/workout/workoutMetricsService.js";

export function getWorkoutResultsCardTemplate() {
  const { totalSets } = workoutMetricsService.calculateWorkoutMetrics(
    appState.session.workoutLog
  );
  const animationClass = appState.session.playCompletionAnimation
    ? "is-animating"
    : "";

  return `
      <div class="card workout-results-container" id="active-card-container">
        <div class="card-content-container">
          <h2 class="card-header">Workout Results</h2>
          <div class="completion-animation-container ${animationClass}" data-action="replayAnimation">
            ${getPlatesHTML("left")}
            ${getPlatesHTML("right")}
            <span class="workout-results-text">Workout Complete!</span>
          </div>
          <div class="workout-results-subtext">
            <p>You crushed it today.</p>
            <p>You've logged <span class="data-highlight ${
              appState.session.currentSessionColorClass
            }">${totalSets}</span> total sets.</p>
          </div>
          <div class="action-button-container">
            <button class="action-button button-finish" data-action="openNewWorkoutModal">Begin Another Workout</button>
            <button class="action-button button-my-data workout-saved-button" data-action="goToMyData">Workout Saved!</button>
          </div>
        </div>
      </div>`;
}

function getPlatesHTML(side) {
  let html = "";
  for (let i = 3; i >= 1; i--) {
    html += `
      <div class="plate plate-${side} plate-num-${i}">
        <span class="plate-number">${i}</span>
        <div class="plate-hole"></div>
        <span class="plate-number">${i}</span>
      </div>`;
  }
  return html;
}
