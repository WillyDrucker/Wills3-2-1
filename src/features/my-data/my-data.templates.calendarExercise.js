/* ==========================================================================
   MY DATA - Calendar Exercise Builder

   Builds exercise block HTML with set rows for calendar view. Handles color
   coding, dumbbell exercises, skipped sets, and superset differentiation.

   Dependencies: isDumbbellExercise, pluralize, colorCodeMap, programConfig
   Used by: my-data.templates.calendarDay.js
   ========================================================================== */

import { colorCodeMap, programConfig } from "config";
import { isDumbbellExercise, pluralize } from "utils";

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
              : `<div class="log-item-results-container history-results-container">
                  <span class="log-item-results-value history-results-value">${
                    log.weight
                  }</span>
                  <span class="log-item-results-unit history-results-unit">&nbsp;${pluralize(
                    log.weight,
                    "lb",
                    "lbs"
                  )}</span>
                  <span class="log-item-results-unit history-results-unit">&nbsp;x&nbsp;</span>
                  <span class="log-item-results-value history-results-value">${
                    log.reps
                  }</span>
                  <span class="log-item-results-unit history-results-unit">&nbsp;${pluralize(
                    log.reps,
                    "rep",
                    "reps"
                  )}${repsUnit}</span>
                </div>`;

          const totalSets = firstLog.exercise.sets;

          const setInfoHtml = `<span class="log-item-set-info-value history-set-value data-highlight ${session.sessionColorClass}">${log.setNumber}</span>
              <span class="log-item-set-info-label history-set-label">&nbsp;of&nbsp;</span>
              <span class="log-item-set-info-value history-set-value data-highlight ${session.sessionColorClass}">${totalSets}</span>`;

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
