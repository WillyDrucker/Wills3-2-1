/* ==========================================================================
   ACTIVE EXERCISE CARD - ACTION AREA TEMPLATES

   🔒 CEMENT: Template-driven color assignments
   - Single-mode: Dynamic colors from Current Focus selector
   - Dual-mode: Static colors (Superset: green/yellow, Partner: green/blue)
   - Skip timers: Always orange
   - Spacer divs: Prevent layout shifts

   Architecture: Conditional HTML generation
   Dependencies: appState, formatTime utility
   Used by: Active card render cycle
   ========================================================================== */

import { appState } from "state";
import { formatTime } from "utils";

export function getActionAreaHTML() {
  if (appState.superset.isActive || appState.partner.isActive) {
    const isAnySideResting =
      appState.rest.superset.left.type !== "none" ||
      appState.rest.superset.right.type !== "none";
    const promptGlowClass = !isAnySideResting ? "is-glowing" : "";

    const topContent = isAnySideResting
      ? `<div class="action-prompt-block is-resting is-dual-mode">
          <p class="resting-label"><span class="truncate-text">Resting For:</span></p>
        </div>`
      : `<div class="action-prompt-block is-prompt is-dual-mode">
          <div class="action-prompt-spacer-top"></div>
          <p class="action-prompt-text ${promptGlowClass}"><span class="truncate-text">${appState.session.activeCardMessage}</span></p>
          <div class="action-prompt-spacer-bottom"></div>
        </div>`;

    const left = getDualModeSideActionHTML("left");
    const right = getDualModeSideActionHTML("right");

    return `${topContent}
            <div class="dual-action-area-container">
              <div class="action-area-cell">${left}</div>
              <div class="action-area-cell">${right}</div>
            </div>`;
  
  } else if (appState.rest.normal.type !== "none") {
    // For normal workouts, rest timer centered with button below
    return `
        <div class="rest-timer-section">
          <div class="timer-container">
            <p class="timer-display ${
              appState.rest.normal.type === "log"
                ? /* 🔒 CEMENT: Timer gets color directly from Current Focus selector value */
                  appState.session.currentTimerColorClass || appState.session.currentSessionColorClass || 'text-plan'
                : "text-orange" /* Skip timers always orange */
            }">${formatTime(appState.rest.normal.timeRemaining)}</p>
          </div>
          <div class="rest-button-container">
            <button class="action-button button-rest-skip" data-action="skipRest">Skip Rest</button>
          </div>
        </div>`;
} else {
    // For normal workouts, action buttons appear below inputs
    return `
        <div class="action-button-group">
          <button class="action-button button-log" data-action="logSet">Log Set</button>
          <button class="action-button button-skip" data-action="skipSet">Skip Set</button>
        </div>`;
  }
}

/**
 * 🔒 CEMENT: Dual-mode side generator
 *
 * Generates HTML for one side of dual-mode table layout.
 * Static color assignments prevent dynamic color inheritance issues.
 * Superset: left=green, right=yellow | Partner: left=green, right=blue
 */
function getDualModeSideActionHTML(side) {
  const restState = appState.rest.superset[side];

  if (restState.type !== "none") {
    /* 🔒 CEMENT: Dual-mode timers use static color schemes */
    let colorClass;
    if (restState.type === "log") {
      // Static color schemes for dual modes
      if (appState.superset.isActive) {
        colorClass = side === "left" ? "text-plan" : "text-warning"; // Green left, Yellow right
      } else if (appState.partner.isActive) {
        colorClass = side === "left" ? "text-plan" : "text-primary"; // Green left, Blue right
      } else {
        colorClass = "text-plan"; // Fallback to green
      }
    } else {
      colorClass = "text-orange"; /* Skip timers always orange */
    }
    return `<div class="timer-and-skip-container stack" style="--stack-space: 16px">
              <p class="timer-display ${colorClass}" data-side="${side}">${formatTime(
      restState.timeRemaining
    )}</p>
              <button class="action-button button-rest-skip" data-action="skipRest" data-side="${side}">Skip Rest</button>
            </div>`;
  } else {
    const hasPendingSets = appState.session.workoutLog.some(
      (log) => log.status === "pending" && log.supersetSide === side
    );
    const completedLeft = appState.session.workoutLog.filter(
      (log) => log.supersetSide === "left" && log.status !== "pending"
    ).length;
    const completedRight = appState.session.workoutLog.filter(
      (log) => log.supersetSide === "right" && log.status !== "pending"
    ).length;
    let isLogDisabled =
      !hasPendingSets ||
      (side === "left" && completedLeft > completedRight) ||
      (side === "right" && completedRight > completedLeft);

    let isSkipDisabled = !hasPendingSets;

    return `<div class="action-button-group">
              <button class="action-button button-log" data-action="logSet" data-side="${side}" ${
      isLogDisabled ? "disabled" : ""
    }>Log Set</button>
              <button class="action-button button-skip" data-action="skipSet" data-side="${side}" ${
      isSkipDisabled ? "disabled" : ""
    }>Skip Set</button>
            </div>`;
  }
}
