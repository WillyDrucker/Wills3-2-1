/* ==========================================================================
   WORKOUT LOG - Log Item Template Builder

   Builds individual log item HTML with exercise info, status, animations,
   and edit panel. Handles normal/superset/partner modes with color coding.

   🔒 CEMENT: Animation progress preservation
   - Element-specific animation delays prevent re-triggering during re-renders
   - Separate log/skip animation variables prevent cascade overwriting
   - Applied to specific elements, not containers, for dual-mode isolation

   Dependencies: appState, programConfig, colorCodeMap, isDumbbellExercise,
                 pluralize, createNumberInputHTML
   Used by: workout-log.template.js (getWorkoutLogTemplate)
   ========================================================================== */

import { appState } from "state";
import { programConfig, colorCodeMap } from "config";
import { isDumbbellExercise, pluralize } from "utils";
import { createNumberInputHTML } from "ui";
import { findPreviousExerciseLog } from "services/data/historyService.js";

export function getLogItemHTML(
  log,
  index,
  setsInWorkout,
  currentLogIndex,
  isWorkoutComplete
) {
  const { exercise, setNumber, status, timestamp, weight, reps } = log;
  const currentPlan = programConfig[appState.session.currentWorkoutName];

  const uniqueExerciseKey = exercise.exercise_name + (log.supersetSide || "");
  const setsForThisExercise = setsInWorkout[uniqueExerciseKey] || 0;

  const isNextUp = index === currentLogIndex && !isWorkoutComplete;

  /* Color based on partner/superset/normal mode */
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
  }
  if (status === "skipped") {
    itemClass += " log-skipped";
    containerClass += " is-skipped-item";
  }

  /* 🔒 CEMENT: Animation progress preservation applied to specific elements, not container */
  /* Prevents animation re-triggering when renderAll() recreates DOM during dual-mode operations */
  /* Separate delay variables prevent log and skip animations from overwriting each other's styles */
  let logAnimationDelay = "";
  let skipAnimationDelay = "";

  if (log.isAnimating) {
    itemClass += " is-updating-log";
    /* 🔒 CEMENT: Preserve log animation progress during re-renders */
    if (log.animationStartTime) {
      const elapsed = Date.now() - log.animationStartTime;
      logAnimationDelay = ` style="animation-delay: -${elapsed}ms;"`;
    }
  }

  if (log.isSkipAnimating) {
    itemClass += " is-skip-animating";
    /* 🔒 CEMENT: Preserve skip animation progress during re-renders */
    if (log.lastSkipAnimationTime) {
      const elapsed = Date.now() - log.lastSkipAnimationTime;
      skipAnimationDelay = ` style="animation-delay: -${elapsed}ms;"`;
    }
  }

  /* Results display or skipped text */
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

  /* Line 2 left: Set info + superset/partner name */
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
  let timestampHtml = timestamp
    ? `<span class="log-item-timestamp ${timestampClass}"${skipAnimationDelay}>${timestamp}</span>`
    : "";

  /* === PREVIOUS EXERCISE RESULTS (PENDING LOGS ONLY) === */
  /* Query history and display last performance for this exercise/set */
  /* Skips over skipped entries to find actual logged data (weight/reps) */
  if (status === "pending") {
    const previousLog = findPreviousExerciseLog(
      exercise.exercise_name,
      setNumber,
      log.supersetSide || null
    );

    if (previousLog) {
      // Prepend "Last: " to previous results text
      // Note: (ea.) suffix is omitted for brevity in historical data
      // Note: findPreviousExerciseLog never returns skipped entries
      resultsHtml = `<div class="log-item-previous-results">
          <span class="log-item-results-unit">Last:&nbsp;</span>
          <span class="log-item-results-value">${previousLog.weight}</span>
          <span class="log-item-results-unit">&nbsp;${pluralize(
            previousLog.weight,
            "lb",
            "lbs"
          )}</span>
          <span class="log-item-results-unit">&nbsp;x&nbsp;</span>
          <span class="log-item-results-value">${previousLog.reps}</span>
          <span class="log-item-results-unit">&nbsp;${pluralize(
            previousLog.reps,
            "rep",
            "reps"
          )}</span>
      </div>`;
    }
  }

  /* 🔒 CEMENT: Simple flex structure is foundation for pixel-perfect CSS layout */
  /* Outer .workout-log-item is flex container, allows two .log-item-line-* children */
  /* to be perfectly centered by justify-content in CSS. Structure must not be more complex. */
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

  /* Pending/next-up: Simple container */
  if (status === "pending" || isNextUp) {
    const clickAction = isNextUp ? ' data-action="scrollToTop"' : '';
    return `<div class="${containerClass}" data-log-index="${index}"${clickAction}>${finalLogDisplayHtml}</div>`;
  }

  /* Completed/skipped: Details with edit panel */
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
