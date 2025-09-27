import { appState } from "state";
import { programConfig, colorCodeMap } from "config";
import { isDumbbellExercise, pluralize } from "utils";
import { createNumberInputHTML } from "ui";
import * as workoutMetricsService from "services/workoutMetricsService.js";

export function getWorkoutLogTemplate() {
  const { workoutLog, currentLogIndex, isWorkoutComplete } = appState.session;
  const { isFullscreen } = appState.ui;

  if (workoutLog.length === 0) {
    return `<div class="card" id="workout-log-card"><div class="card-content-container"><h2 class="card-header" data-action="scrollToWorkoutLog">Today's Workout</h2><div id="workout-content" class="workout-items"><p style="color: var(--on-surface-medium); text-align: center; padding: 20px 0;">Your workout log will appear here.</p></div></div></div>`;
  }

  const setsInWorkout =
    appState.superset.isActive || appState.partner.isActive
      ? workoutMetricsService.calculateDualModeSetsInWorkout(workoutLog)
      : workoutMetricsService.calculateWorkoutMetrics(workoutLog).setsInWorkout;

  const logItemsHtml = workoutLog
    .map((log, index) =>
      getLogItemHTML(
        log,
        index,
        setsInWorkout,
        currentLogIndex,
        isWorkoutComplete
      )
    )
    .join("");

  const buttonText = isFullscreen ? "Exit Full Screen" : "Enter Full Screen";

  const headerHtml = `<h2 class="card-header" id="workout-log-header" data-action="scrollToWorkoutLog">Today's Workout</h2>`;

  return `
    <div class="card" id="workout-log-card">
      <div class="card-content-container">
        ${headerHtml}
        <div id="workout-content" class="workout-items">${logItemsHtml}</div>
        <div class="card-footer-action">
          <button class="action-button button-primary" data-action="toggleFullScreen">${buttonText}</button>
        </div>
      </div>
    </div>
  `;
}

function getLogItemHTML(
  log,
  index,
  setsInWorkout,
  currentLogIndex,
  isWorkoutComplete
) {
  const { exercise, setNumber, status, timestamp, weight, reps } = log;
  const currentPlan = programConfig[appState.session.currentWorkoutPlanName];

  const uniqueExerciseKey = exercise.exercise_name + (log.supersetSide || "");
  const setsForThisExercise = setsInWorkout[uniqueExerciseKey] || 0;

  const isNextUp = index === currentLogIndex && !isWorkoutComplete;

  let exerciseColorClass;
  if (appState.partner.isActive) {
    exerciseColorClass = log.userColorClass;
  } else if (log.supersetSide) {
    exerciseColorClass =
      log.supersetSide === "left" ? "text-plan" : "text-warning";
  } else {
    exerciseColorClass =
      colorCodeMap[exercise[currentPlan.colorKey]] || "text-plan";
  }

  let itemClass = "workout-log-item";
  let containerClass = "workout-log-item-container";
  if (status === "completed") itemClass += " log-completed";
  if (isNextUp) {
    itemClass += " is-next-up";
    containerClass += " is-next-up-clickable";
  }
  if (status === "skipped") {
    itemClass += " log-skipped";
    containerClass += " is-skipped-item";
  }
  // 🔒 CEMENT: Animation progress preservation applied to specific elements, not container
  // Prevents animation re-triggering when renderAll() recreates DOM elements during dual-mode operations
  // Separate delay variables prevent log and skip animations from overwriting each other's styles
  let logAnimationDelay = "";
  let skipAnimationDelay = "";

  if (log.isAnimating) {
    itemClass += " is-updating-log";
    // 🔒 CEMENT: Preserve log animation progress during re-renders
    // Applied to specific elements prevents container-level cascade affecting all children
    if (log.animationStartTime) {
      const elapsed = Date.now() - log.animationStartTime;
      logAnimationDelay = ` style="animation-delay: -${elapsed}ms;"`;
    }
  }

  if (log.isSkipAnimating) {
    itemClass += " is-skip-animating";
    // 🔒 CEMENT: Preserve skip animation progress during re-renders
    // Element-specific delays essential for dual-mode timer animation isolation
    if (log.lastSkipAnimationTime) {
      const elapsed = Date.now() - log.lastSkipAnimationTime;
      skipAnimationDelay = ` style="animation-delay: -${elapsed}ms;"`;
    }
  }

  let resultsHtml = "";
  if (status === "completed") {
    const repsUnit = isDumbbellExercise(exercise) ? " (ea.)" : "";
    resultsHtml = `<div class="log-item-results-container">
        <span class="log-item-results-value"${logAnimationDelay}>${weight}</span>
        <span class="log-item-results-unit"${logAnimationDelay}>&nbsp;${pluralize(
          weight,
          "lb",
          "lbs"
        )}</span>
        <span class="log-item-results-unit"${logAnimationDelay}>&nbsp;x&nbsp;</span>
        <span class="log-item-results-value"${logAnimationDelay}>${reps}</span>
        <span class="log-item-results-unit"${logAnimationDelay}>&nbsp;${pluralize(
          reps,
          "rep",
          "reps"
        )}${repsUnit}</span>
    </div>`;
  } else if (status === "skipped") {
    resultsHtml = `<span class="log-item-skipped-text">Skipped</span>`;
  }

  const setInfoHtml = `<span class="log-item-set-info-label">Set:&nbsp;</span><span class="log-item-set-info-value data-highlight ${appState.session.currentSessionColorClass}">${setNumber}</span><span class="log-item-set-info-label">&nbsp;of&nbsp;</span><span class="log-item-set-info-value data-highlight ${appState.session.currentSessionColorClass}">${setsForThisExercise}</span>`;

  let line2LeftHtml;
  if (appState.superset.isActive || appState.partner.isActive) {
    const nameText = appState.superset.isActive
      ? appState.weeklyPlan[log.exercise.day]?.title || ""
      : log.userName;
    const nameColorClass = appState.superset.isActive
      ? log.supersetSide === "left"
        ? "text-plan"
        : "text-warning"
      : log.userColorClass;

    const separatorHtml = `<span class="log-item-separator"> - </span>`;
    const nameHtml = `<span class="data-highlight ${nameColorClass} log-item-superset-part">${nameText}</span>`;

    line2LeftHtml = `<div class="log-item-details-left">
        <div class="log-item-details-content truncate-text">
            ${setInfoHtml}${separatorHtml}${nameHtml}
        </div>
    </div>`;
  } else {
    line2LeftHtml = `<div class="log-item-details-left">
        <div class="log-item-details-content truncate-text">
            ${setInfoHtml}
        </div>
    </div>`;
  }

  const timestampClass = log.restWasSkipped ? "text-skip" : "";
  const timestampHtml = timestamp
    ? `<span class="log-item-timestamp ${timestampClass}"${skipAnimationDelay}>${timestamp}</span>`
    : "";
  /*
    CEMENTED (v5.0.6 - Final Architecture):
    This HTML structure is deliberately simple and is the required foundation for the
    pixel-perfect CSS layout. The outer .workout-log-item is a flex container, which
    allows the two .log-item-line-* children to be perfectly centered by the
    `justify-content` property in the CSS. This structure should not be made more complex.
  */
  const finalLogDisplayHtml = `<div class="${itemClass}"${logAnimationDelay}>
    <div class="log-item-line-1">
        <span class="log-item-exercise-name ${exerciseColorClass} truncate-text">${exercise.exercise_name}</span>
        ${timestampHtml}
    </div>
    <div class="log-item-line-2">
        ${line2LeftHtml}
        ${resultsHtml}
    </div>
  </div>`;

  if (status === "pending" || isNextUp) {
    return `<div class="${containerClass}" data-log-index="${index}">${finalLogDisplayHtml}</div>`;
  } else {
    const isDumbbell = isDumbbellExercise(exercise);
    const weightLabel = isDumbbell ? "Weight (Per Hand)" : "Weight (lbs)";
    const repsLabel = isDumbbell
      ? "Reps (Per Hand)"
      : 'Reps (Target: <span class="text-plan">10</span>)';

    return `<details class="${containerClass}" data-log-index="${index}">
                <summary>${finalLogDisplayHtml}</summary>
                <div class="edit-log-controls">
                  <div class="input-labels-container">
                    <div class="input-label">${repsLabel}</div>
                    <div class="input-label">${weightLabel}</div>
                  </div>
                  <div class="input-controls-grid">
                    ${createNumberInputHTML(
                      `reps-edit-${index}`,
                      reps,
                      true,
                      index
                    )}
                    ${createNumberInputHTML(
                      `weight-edit-${index}`,
                      weight,
                      true,
                      index
                    )}
                  </div>
                  <div class="edit-log-buttons">
                    <button class="action-button button-cancel" data-action="cancelLog">Cancel</button>
                    <button class="action-button button-clear-set" data-action="clearSet" data-log-index="${index}">Clear Set</button>
                    <button class="action-button button-update-log" data-action="updateLog" data-log-index="${index}">Update</button>
                  </div>
                </div>
              </details>`;
  }
}
