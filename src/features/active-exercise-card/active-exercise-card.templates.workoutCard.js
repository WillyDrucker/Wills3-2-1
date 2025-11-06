import { appState } from "state";
import { isDumbbellExercise } from "utils";
import { createNumberInputHTML } from "ui";
import { getAnchorAreaHTML } from "./active-exercise-card.templates.fuelGauge.js";
import { getActionAreaHTML } from "./active-exercise-card.templates.actionArea.js";
import { getExerciseSelectorHTML } from "./active-exercise-card.templates.exerciseSelector.js";
import * as workoutMetricsService from "services/workout/workoutMetricsService.js";
import { getRepTarget } from "../../services/workout/repTargetService.js";

/* ==========================================================================
   ACTIVE EXERCISE CARD - Workout Card Template

   Generates the main workout card HTML with inputs, selectors, and actions.
   Handles both normal and dual-mode (superset/partner) layouts.

   Dependencies: fuelGauge, actionArea, exerciseSelector templates, workoutMetricsService
   Used by: active-exercise-card.template.js
   ========================================================================== */

function getCardHeaderHTML(logEntry = null) {
  return `
    <div id="active-card-header" class="card-header-container">
      <div class="card-header-line">
        <h2 class="card-header">${appState.session.activeCardHeaderMessage}</h2>
      </div>
    </div>
  `;
}

export function getWorkoutCardHTML(logEntry) {
  const { exercise } = logEntry;
  const setsInWorkout =
    appState.superset.isActive || appState.partner.isActive
      ? workoutMetricsService.calculateDualModeSetsInWorkout(
          appState.session.workoutLog
        )
      : workoutMetricsService.calculateWorkoutMetrics(
          appState.session.workoutLog
        ).setsInWorkout;

  const uniqueExerciseKey =
    exercise.exercise_name + (logEntry.supersetSide || "");
  const setsForThisExercise = setsInWorkout[uniqueExerciseKey] || 0;

  const isResting =
    appState.rest.normal.type !== "none" ||
    ((appState.superset.isActive || appState.partner.isActive) &&
      (appState.rest.superset.left.type !== "none" ||
        appState.rest.superset.right.type !== "none"));
  const cardGlowClass = !isResting ? "is-glowing-border" : "";

  const isDumbbell = isDumbbellExercise(exercise);
  const weightLabel = isDumbbell ? "Weight (Per Hand)" : "Weight (lbs)";
  const repTarget = getRepTarget();
  const repsLabel = isDumbbell
    ? "Reps (Per Hand)"
    : `Reps (Target: <span class="text-plan">${repTarget}</span>)`;

  const isDualMode = appState.superset.isActive || appState.partner.isActive;

  if (isDualMode) {
    // Updated layout for dual-mode to match normal mode structure
    const isDualModeResting =
      appState.rest.superset.left.type !== "none" ||
      appState.rest.superset.right.type !== "none";

    return `
      <div class="card ${cardGlowClass} is-dual-mode" id="active-card-container">
        <div class="card-content-container">

          ${getCardHeaderHTML(logEntry)}

          <div class="youtube-overlay-wrapper" style="margin-top: 4px;">
            ${getExerciseSelectorHTML(logEntry, setsForThisExercise)}
            ${getYouTubeOverlayButtonHTML(logEntry)}
          </div>

          <div id="card-anchor-area" class="dual-fuel-gauge-area" style="margin-top: 16px;">
            ${getAnchorAreaHTML()}
          </div>

          <div class="input-group" style="margin-top: 15px;">
            <div class="input-2col-grid-swapped">
              <div class="input-label" style="grid-area: reps-label">${repsLabel}</div>
              <div class="input-label" style="grid-area: weight-label">${weightLabel}</div>
              <div style="grid-area: reps-input">${createNumberInputHTML("reps", logEntry.reps)}</div>
              <div style="grid-area: weight-input">${createNumberInputHTML("weight", logEntry.weight)}</div>
            </div>
          </div>

          ${isDualModeResting ?
            `` :
            `<div class="begin-log-text-line dual-mode-inactive-slack" style="margin-top: var(--dual-upper-slack-spacing);">
              <p class="begin-log-text">Begin Exercise - Log Results</p>
            </div>`
          }

          <div id="card-action-area" class="stack dual-workout-action-area" style="margin-top: ${isDualModeResting ? 'var(--dual-upper-slack-spacing)' : 'var(--dual-lower-slack-spacing)'};">${getActionAreaHTML()}</div>

        </div>
      </div>`;
  } else {
    // New layout for normal workouts
    return `
      <div class="card ${cardGlowClass}" id="active-card-container">
        <div class="card-content-container">

          ${getCardHeaderHTML(logEntry)}

          <div class="youtube-overlay-wrapper" style="margin-top: 0px;">
            ${getExerciseSelectorHTML(logEntry, setsForThisExercise)}
            ${getYouTubeOverlayButtonHTML(logEntry)}
          </div>

          <div id="card-anchor-area" class="normal-fuel-gauge-area" style="margin-top: 16px;">
            ${getAnchorAreaHTML(true)}
          </div>

          <div class="input-group" style="margin-top: 15px;">
            <div class="input-2col-grid-swapped">
              <div class="input-label" style="grid-area: reps-label">${repsLabel}</div>
              <div class="input-label" style="grid-area: weight-label">${weightLabel}</div>
              <div style="grid-area: reps-input">${createNumberInputHTML("reps", logEntry.reps)}</div>
              <div style="grid-area: weight-input">${createNumberInputHTML("weight", logEntry.weight)}</div>
            </div>
          </div>

          ${appState.rest.normal.type !== "none" ?
            `<div class="resting-for-label" style="margin-top: 11px;">
              <p class="resting-label-text">Resting For:</p>
            </div>` :
            `<div class="begin-log-text-line" style="margin-top: var(--upper-slack-spacing);">
              <p class="begin-log-text">Begin Exercise - Log Results</p>
            </div>`
          }

          <div id="card-action-area" class="stack normal-workout-action-area" style="margin-top: ${appState.rest.normal.type !== "none" ? '13px' : 'var(--lower-slack-spacing)'};">${getActionAreaHTML()}</div>

        </div>
      </div>`;
  }
}

function getYouTubeOverlayButtonHTML(logEntry) {
  if (!logEntry || !logEntry.exercise.youtube_link) return "";
  return `<button data-action="showVideo" data-video-url="${logEntry.exercise.youtube_link}" class="action-button button-youtube youtube-overlay-button" aria-label="Show exercise video"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 7.197a2.44 2.44 0 0 0-1.72-1.72C16.25 5 12 5 12 5s-4.25 0-5.895.477a2.44 2.44 0 0 0-1.72 1.72C4 8.843 4 12 4 12s0 3.157.485 4.803a2.44 2.44 0 0 0 1.72 1.72C7.75 19 12 19 12 19s4.25 0 5.895-.477a2.44 2.44 0 0 0 1.72-1.72C20 15.157 20 12 20 12s0-3.157-.385-4.803zM9.5 15.5v-7l6 3.5-6 3.5z"/></svg></button>`;
}