/* ==========================================================================
   EDIT WORKOUT MODAL - HTML Template

   Generates Edit Workout modal HTML for editing completed workout sessions.
   Recreates "Today's Workout" view in confirmation window for historical logs.

   Architecture:
   - Confirmation modal pattern (backdrop + card)
   - Title: "Edit Workout"
   - Session header: day:bodypart + date
   - Label: "Edit Log" (singular) or "Edit Logs" (plural)
   - Log items: All as <details> with edit panels
   - Buttons: Cancel, Delete, Update (matches Today's Workout but different actions)

   Dependencies: appState, colorCodeMap, programConfig, isDumbbellExercise,
                 pluralize, createNumberInputHTML
   Used by: edit-workout-modal.index.js (renderEditWorkoutModal)
   ========================================================================== */

import { appState } from "state";
import { colorCodeMap, programConfig } from "config";
import { isDumbbellExercise, pluralize } from "utils";
import { createNumberInputHTML } from "ui";

/* Helper function to format timestamp as 12-hour time with AM/PM */
function formatCompletionTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Generate Edit Workout modal HTML for a specific workout session
 * @param {Object} workout - Workout session from appState.user.history.workouts
 * @returns {string} HTML template string for Edit Workout modal
 */
export function getEditWorkoutModalTemplate(workout) {
  if (!workout) return "";

  const currentPlan = programConfig[workout.planName];

  // Build date strings
  const sessionDate = new Date(workout.timestamp);
  const dateString = sessionDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Day of week (e.g., "Thursday")
  const dayOfWeek = sessionDate.toLocaleDateString("en-US", {
    weekday: "long",
  });

  // Extract day name from first log
  const firstLog = workout.logs[0];
  const dayName = firstLog?.exercise?.day || "";

  // Color coding for body parts
  const bodyPartColorClass =
    colorCodeMap[workout.bodyPartColorKey] || "text-plan";
  const bodyPart2ColorClass =
    colorCodeMap[workout.bodyPart2ColorKey] || "text-warning";

  // Build body part display (handle Superset with & separator)
  let bodyPartHtml;
  if (workout.bodyPart.includes("&")) {
    const [part1, part2] = workout.bodyPart.split("&");
    bodyPartHtml = `<span class="${bodyPartColorClass}">${part1.trim()}</span><span class="text-on-surface-medium"> & </span><span class="${bodyPart2ColorClass}">${part2.trim()}</span>`;
  } else {
    bodyPartHtml = `<span class="${bodyPartColorClass}">${workout.bodyPart}</span>`;
  }

  // Format completion timestamp
  const completionTimeStr = formatCompletionTime(workout.completedTimestamp);
  const completionHtml = completionTimeStr
    ? `<span class="history-completion-label">Completed:</span> <span class="history-completion-value">${completionTimeStr}</span>`
    : '';

  // Build two-line header (day/date + bodypart/completion) - EXACT match to My Data structure
  const sessionHeaderHtml = `<div class="edit-workout-header">
    <div class="edit-workout-day-date">
      <span class="edit-workout-day-text">${dayOfWeek}</span>
      <span class="edit-workout-date-text data-highlight text-plan">${dateString}</span>
    </div>
    <div class="edit-workout-bodypart-completion">
      <span class="edit-workout-bodypart-text">${bodyPartHtml}</span>
      <span class="edit-workout-completion-text">${completionHtml}</span>
    </div>
  </div>`;

  // Group exercises by name with metadata (same logic as My Data calendar)
  const exercisesGrouped = workout.logs.reduce((acc, log) => {
    const key = log.exercise.exercise_name;
    if (!acc[key]) {
      acc[key] = {
        logs: [],
        supersetSide: log.supersetSide || null,
        exercise: log.exercise,
      };
    }
    acc[key].logs.push(log);
    return acc;
  }, {});

  // Sort sets within each exercise by set number
  for (const exerciseName in exercisesGrouped) {
    exercisesGrouped[exerciseName].logs.sort((a, b) => a.setNumber - b.setNumber);
  }

  // Group exercises by type for proper ordering: Normal → Left → Right
  const leftExercises = [];
  const rightExercises = [];
  const normalExercises = [];

  for (const exerciseName in exercisesGrouped) {
    const exerciseData = exercisesGrouped[exerciseName];
    if (exerciseData.supersetSide === "left") {
      leftExercises.push({ name: exerciseName, data: exerciseData });
    } else if (exerciseData.supersetSide === "right") {
      rightExercises.push({ name: exerciseName, data: exerciseData });
    } else {
      normalExercises.push({ name: exerciseName, data: exerciseData });
    }
  }

  // Combine in proper order
  const orderedExercises = [
    ...normalExercises,
    ...leftExercises,
    ...rightExercises,
  ];

  // Build log items HTML
  const logItemsHtml = orderedExercises
    .map(({ name: exerciseName, data: exerciseData }) => {
      return exerciseData.logs
        .map((log) => getHistoricalLogItemHTML(log, workout, currentPlan))
        .join("");
    })
    .join("");

  return `
    <div class="superset-modal-backdrop" data-action="handleEditWorkoutBackdropClick"></div>
    <div class="superset-modal-content card confirmation-modal-card edit-workout-card">
      <h2 class="confirmation-modal-title">Edit Workout</h2>

      ${sessionHeaderHtml}

      <div class="edit-workout-log-list">
        ${logItemsHtml}
      </div>

      <div class="edit-workout-button-group">
        <button class="edit-workout-cancel-button" data-action="cancelEditWorkout" data-mousedown-action="prepareCancelEditWorkout">Cancel</button>
        <button class="edit-workout-delete-button" data-action="openDeleteWorkoutModal">
          <span class="button-delete-line1">Delete</span>
          <span class="button-delete-line2">Workout</span>
        </button>
        <button class="edit-workout-update-button" data-action="updateWorkout">Update</button>
      </div>
    </div>
  `;
}

/**
 * Generate individual historical log item HTML with edit panel
 * Reuses workout-log structure but adapted for historical editing
 */
function getHistoricalLogItemHTML(log, workout, currentPlan) {
  const { exercise, setNumber, status, weight, reps } = log;

  // Color based on superset side or exercise type
  let exerciseColorClass;
  if (log.supersetSide) {
    exerciseColorClass =
      log.supersetSide === "left" ? "text-plan" : "text-warning";
  } else {
    exerciseColorClass =
      colorCodeMap[exercise[currentPlan.colorKey]] || "text-plan";
  }

  let itemClass = "workout-log-item edit-workout-log-item";
  let containerClass = "workout-log-item-container edit-workout-item-container";

  if (status === "completed") itemClass += " log-completed";
  if (status === "skipped") {
    itemClass += " log-skipped";
    containerClass += " is-skipped-item";
  }

  // Results display or skipped text
  let resultsHtml = "";
  if (status === "completed") {
    const repsUnit = isDumbbellExercise(exercise) ? " (ea.)" : "";
    resultsHtml = `<div class="log-item-results-container">
        <span class="log-item-results-value">${weight}</span>
        <span class="log-item-results-unit">&nbsp;${pluralize(weight, "lb", "lbs")}</span>
        <span class="log-item-results-unit">&nbsp;x&nbsp;</span>
        <span class="log-item-results-value">${reps}</span>
        <span class="log-item-results-unit">&nbsp;${pluralize(reps, "rep", "reps")}${repsUnit}</span>
    </div>`;
  } else if (status === "skipped") {
    resultsHtml = `<span class="log-item-skipped-text">Skipped</span>`;
  }

  // Set info
  const totalSets = exercise.sets;
  const setInfoHtml = `<span class="log-item-set-info-label">Set:&nbsp;</span><span class="log-item-set-info-value data-highlight ${workout.sessionColorClass}">${setNumber}</span><span class="log-item-set-info-label">&nbsp;of&nbsp;</span><span class="log-item-set-info-value data-highlight ${workout.sessionColorClass}">${totalSets}</span>`;

  // Line 2 left: Set info + superset/partner name (if applicable)
  let line2LeftHtml;
  if (workout.bodyPart.includes("&") || log.supersetSide) {
    // Superset or Partner mode
    const nameText = log.supersetSide
      ? appState.weeklyPlan[log.exercise.day]?.title || ""
      : "";
    const nameColorClass = log.supersetSide === "left" ? "text-plan" : "text-warning";
    const separatorHtml = nameText ? `<span class="log-item-separator"> - </span>` : "";
    const nameHtml = nameText
      ? `<span class="data-highlight ${nameColorClass} log-item-superset-part">${nameText}</span>`
      : "";

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

  const finalLogDisplayHtml = `<div class="${itemClass}">
    <div class="log-item-line-1">
        <span class="log-item-exercise-name ${exerciseColorClass} truncate-text">${exercise.exercise_name}</span>
    </div>
    <div class="log-item-line-2">
        ${line2LeftHtml}
        ${resultsHtml}
    </div>
  </div>`;

  // Edit panel (all historical logs are editable)
  const isDumbbell = isDumbbellExercise(exercise);
  const weightLabel = isDumbbell ? "Weight (Per Hand)" : "Weight (lbs)";
  const repsLabel = isDumbbell
    ? "Reps (Per Hand)"
    : 'Reps (Target: <span class="text-plan">10</span>)';

  // Create unique index for this log item
  const logIndex = `${workout.id}-${setNumber}-${log.supersetSide || "normal"}`;

  return `<details class="${containerClass}" data-workout-id="${workout.id}" data-set-number="${setNumber}" data-superset-side="${log.supersetSide || ""}">
              <summary>${finalLogDisplayHtml}</summary>
              <div class="edit-log-controls">
                <div class="input-labels-container">
                  <div class="input-label">${repsLabel}</div>
                  <div class="input-label">${weightLabel}</div>
                </div>
                <div class="input-controls-grid">
                  ${createNumberInputHTML(`reps-edit-${logIndex}`, reps, true, logIndex)}
                  ${createNumberInputHTML(`weight-edit-${logIndex}`, weight, true, logIndex)}
                </div>
                <div class="edit-log-buttons">
                  <button class="action-button button-cancel" data-action="cancelWorkoutLog">Cancel</button>
                  <button class="action-button button-clear-set" data-action="deleteWorkoutLog" data-workout-id="${workout.id}" data-set-number="${setNumber}" data-superset-side="${log.supersetSide || ""}">Delete</button>
                  <button class="action-button button-update-log" data-action="updateWorkoutLog" data-workout-id="${workout.id}" data-set-number="${setNumber}" data-superset-side="${log.supersetSide || ""}">Update</button>
                </div>
              </div>
            </details>`;
}
