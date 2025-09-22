import { appState } from "state";
import { isDumbbellExercise, calculateCompletionTime, pluralize } from "utils";
import { createNumberInputHTML } from "ui";
import { getAnchorAreaHTML } from "./active-exercise-card.templates.fuelGauge.js";
import { getActionAreaHTML } from "./active-exercise-card.templates.actionArea.js";
import { getExerciseSelectorHTML } from "./active-exercise-card.templates.exerciseSelector.js";
import * as workoutMetricsService from "services/workoutMetricsService.js";

function getCardHeaderHTML() {
  const remaining = appState.session.workoutTimeRemaining;
  const durationUnit = pluralize(remaining, "Minute", "Minutes");
  const durationText = `${remaining} ${durationUnit} Remaining`;
  const completionTime = calculateCompletionTime(remaining);

  /*
    ALIGNMENT FIX (v5.2.1):
    Changed h2 to span for consistent element types.
    This ensures both elements on the same line have identical rendering behavior
    and eliminates baseline alignment issues between different element types.
  */
  return `
    <div id="active-card-header" class="card-header-container" data-action="scrollToActiveCard">
        <div class="card-header-line">
            <span class="card-header"><span class="truncate-text">${appState.session.activeCardHeaderMessage}</span></span>
            <span class="card-header-clock"><span class="truncate-text">${appState.ui.currentTime}</span></span>
        </div>
        <div class="card-header-line">
            <span class="card-header-dynamic-text"><span class="truncate-text ${appState.session.currentSessionColorClass}">${durationText}</span></span>
            <span class="card-header-dynamic-text"><span class="truncate-text ${appState.session.currentSessionColorClass}">${completionTime}</span></span>
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
  const repsLabel = isDumbbell
    ? "Reps (Per Hand)"
    : 'Reps (Target: <span class="text-plan">10</span>)';

  return `
      <div class="card ${cardGlowClass}" id="active-card-container">
        <div class="card-content-container">

          ${getCardHeaderHTML()}

          <div class="youtube-overlay-wrapper" style="margin-top: var(--youtube-overlay-spacing);">
            ${getExerciseSelectorHTML(logEntry, setsForThisExercise)}
            ${getYouTubeOverlayButtonHTML(logEntry)}
          </div>

          <div class="input-group">
            <div class="input-2col-grid">
              <div class="input-label truncate-text" style="grid-area: weight-label">${weightLabel}</div>
              <div class="input-label truncate-text" style="grid-area: reps-label">${repsLabel}</div>
              <div style="grid-area: weight-input">${createNumberInputHTML("weight", logEntry.weight)}</div>
              <div style="grid-area: reps-input">${createNumberInputHTML("reps", logEntry.reps)}</div>
            </div>
          </div>

          <div id="card-anchor-area" data-action="scrollToActiveCard">${getAnchorAreaHTML()}</div>

          <div id="card-action-area" class="stack">${getActionAreaHTML()}</div>

        </div>
      </div>`;
}

function getYouTubeOverlayButtonHTML(logEntry) {
  if (!logEntry || !logEntry.exercise.youtube_link) return "";
  return `<button data-action="showVideo" data-video-url="${logEntry.exercise.youtube_link}" class="action-button button-youtube youtube-overlay-button" aria-label="Show exercise video"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 7.197a2.44 2.44 0 0 0-1.72-1.72C16.25 5 12 5 12 5s-4.25 0-5.895.477a2.44 2.44 0 0 0-1.72 1.72C4 8.843 4 12 4 12s0 3.157.485 4.803a2.44 2.44 0 0 0 1.72 1.72C7.75 19 12 19 12 19s4.25 0 5.895-.477a2.44 2.44 0 0 0 1.72-1.72C20 15.157 20 12 20 12s0-3.157-.385-4.803zM9.5 15.5v-7l6 3.5-6 3.5z"/></svg></button>`;
}