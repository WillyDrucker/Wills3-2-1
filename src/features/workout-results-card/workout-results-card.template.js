/* ==========================================================================
   WORKOUT RESULTS CARD - HTML Template

   Generates workout completion card HTML with plate animations, results
   summary, and two-state action button (Saved → Begin Another Workout).

   Architecture: Button initial state
   - Button starts as green "Workout Saved!" (button-log class)
   - Disabled attribute prevents clicks during animation
   - State transition handled in workout-results-card.index.js

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

  // Check if current session is committed
  const workout = appState.user.history.workouts.find((w) => w.id === appState.session.id);
  const isCommitted = workout?.isCommitted || false;

  const commitBanner = isCommitted
    ? `<div class="workout-saved-banner">
         <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
           <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
         </svg>
         <span>Workout Logged!</span>
       </div>`
    : '';

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
          ${commitBanner}
          <div class="action-button-container">
            <button class="action-button button-log workout-saved-button" data-action="openNewWorkoutModal" disabled>Workout Saved!</button>
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
