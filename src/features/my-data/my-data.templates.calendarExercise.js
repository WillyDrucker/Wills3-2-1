/* ==========================================================================
   MY DATA - Calendar Exercise Builder

   Builds exercise block HTML with set rows for calendar view. Handles color
   coding, dumbbell exercises, skipped sets, superset differentiation, and
   visual state indicators for active vs completed sessions.

   Architecture: Visual state system
   - Current active session: White text (in-progress)
   - Completed sessions: Green text (logged/database saved)
   - Color swap aligns green with logged state semantic meaning

   Dependencies: isDumbbellExercise, pluralize, colorCodeMap, programConfig,
                 appState
   Used by: my-data.templates.calendarDay.js
   ========================================================================== */

import { colorCodeMap, programConfig } from "config";
import { isDumbbellExercise, pluralize } from "utils";
import { appState } from "state";

export function buildExerciseBlocksHTML(orderedExercises, session, hasWideResults) {
  const currentPlan =
    programConfig[session.planName] || programConfig["Will's 3-2-1:"];

  return orderedExercises
    .map(({ name: exerciseName, data: exerciseData }) => {
      const logsForExercise = exerciseData.logs;
      const firstLog = logsForExercise[0];

      /* Color based on superset side or exercise type */
      let exerciseColorClass;
      if (firstLog.supersetSide) {
        exerciseColorClass =
          firstLog.supersetSide === "left"
            ? "text-plan"
            : "text-warning";
      } else {
        exerciseColorClass =
          colorCodeMap[firstLog.exercise[currentPlan.colorKey]] ||
          "text-plan";
      }

      /* Determine text color based on current session */
      /* Current active session = white (in progress), Completed sessions = green (logged) */
      const isCurrentSessionMatch = session.id === appState.session.id;
      const valueColorClass = isCurrentSessionMatch ? "" : "text-plan";

      /* Build set rows */
      const setRowsHtml = logsForExercise
        .map((log) => {
          const isDumbbell = isDumbbellExercise(log.exercise);
          if (isDumbbell) hasWideResults.value = true;
          const repsUnit = isDumbbell ? " (ea.)" : "";

          /* Format results or show skipped */
          const resultText =
            log.status === "skipped"
              ? `<span class="text-orange history-skipped-text">Skipped</span>`
              : `<div class="history-results-container">
                  <span class="history-results-value ${valueColorClass}">${
                    log.weight
                  }</span>
                  <span class="history-results-unit">&nbsp;${pluralize(
                    log.weight,
                    "lb",
                    "lbs"
                  )}</span>
                  <span class="history-results-unit">&nbsp;x&nbsp;</span>
                  <span class="history-results-value ${valueColorClass}">${
                    log.reps
                  }</span>
                  <span class="history-results-unit">&nbsp;${pluralize(
                    log.reps,
                    "rep",
                    "reps"
                  )}${repsUnit}</span>
                </div>`;

          const totalSets = firstLog.exercise.sets;

          /* Add "Set: " prefix for committed workouts (inside selector) */
          const setPrefix = session.isCommitted ? `<span class="log-item-set-info-label history-set-label text-on-surface-medium">Set: </span>` : '';
          const setInfoHtml = `${setPrefix}<span class="log-item-set-info-value history-set-value data-highlight ${session.sessionColorClass}">${log.setNumber}</span><span class="log-item-set-info-label history-set-label"> of </span><span class="log-item-set-info-value history-set-value data-highlight ${session.sessionColorClass}">${totalSets}</span>`;

          return `<div class="history-exercise-set-row history-set-row">
                    <div class="history-set-left">${setInfoHtml}</div>
                    <div class="history-set-right">${resultText}</div>
                 </div>`;
        })
        .join("");

      return `<div class="history-exercise-block">
                <div class="history-exercise-name ${exerciseColorClass}">${exerciseName}</div>
                <div class="history-set-rows-group">
                  ${setRowsHtml}
                </div>
              </div>`;
    })
    .join("");
}
