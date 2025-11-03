/* ==========================================================================
   WORKOUT LOG - Card Template

   Generates workout log card HTML with header and log items. Orchestrates
   log item building and calculates workout metrics.

   Dependencies: appState, workoutMetricsService, getLogItemHTML
   Used by: workout-log.index.js (renderWorkoutLog)
   ========================================================================== */

import { appState } from "state";
import * as workoutMetricsService from "services/workout/workoutMetricsService.js";
import { getLogItemHTML } from "./workout-log.templates.item.js";

export function getWorkoutLogTemplate() {
  const { workoutLog, currentLogIndex, isWorkoutComplete } = appState.session;

  if (workoutLog.length === 0) {
    return `<div class="card" id="workout-log-card"><div class="card-content-container"><h2 class="card-header" data-action="scrollToTop">Today's Workout</h2><div id="workout-content" class="workout-items"><p style="color: var(--on-surface-medium); text-align: center; padding: 20px 0;">Your workout log will appear here.</p></div></div></div>`;
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

  const headerHtml = `<h2 class="card-header" id="workout-log-header" data-action="scrollToTop">Today's Workout</h2>`;

  const hasGlowAnimation = workoutLog.some((log, idx) => idx === currentLogIndex && !isWorkoutComplete);
  const cardAction = hasGlowAnimation ? ' data-action="scrollToTop"' : '';

  return `
    <div class="card" id="workout-log-card"${cardAction}>
      <div class="card-content-container">
        ${headerHtml}
        <div id="workout-content" class="workout-items">${logItemsHtml}</div>
      </div>
    </div>
  `;
}
