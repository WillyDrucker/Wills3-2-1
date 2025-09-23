/* ==========================================================================
   ACTIVE EXERCISE CARD - ACTION AREA TEMPLATES

   🔒 CEMENT: Dual Color System Architecture
   - Timer Colors: Controlled by "Current Focus" day selector (currentTimerColorClass)
   - Header Colors: Controlled by "Current Session" time selector (currentSessionColorClass)
   - Skip Timers: Always orange regardless of selectors

   Template Features:
   - Spacer divs prevent layout shift between states
   - Log/skip timer color differentiation
   - Support for normal and dual-mode timers
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
      : `<div class="action-prompt-block is-prompt">
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
    return `
        <div class="action-prompt-block is-resting">
          <div class="action-prompt-spacer-top"></div>
          <p class="resting-label"><span class="truncate-text">Resting For:</span></p>
          <div class="action-prompt-spacer-bottom"></div>
        </div>
        <div class="timer-container">
          <p class="timer-display ${
            appState.rest.normal.type === "log"
              ? /* 🔒 CEMENT: Timer gets color directly from Current Focus selector value */
                appState.session.currentTimerColorClass || appState.session.currentSessionColorClass || 'text-plan'
              : "text-orange" /* Skip timers always orange */
          }">${formatTime(appState.rest.normal.timeRemaining)}</p>
        </div>
        <div class="action-button-group">
          <button class="action-button button-rest-skip" data-action="skipRest">Skip Rest</button>
        </div>`;
} else {
    const glowingClass =
      appState.rest.normal.type === "none" ? "is-glowing" : "";
    return `
        <div class="action-prompt-block is-prompt">
          <div class="action-prompt-spacer-top"></div>
          <p class="action-prompt-text ${glowingClass}" data-action="scrollToActiveCard"><span class="truncate-text">${appState.session.activeCardMessage}</span></p>
          <div class="action-prompt-spacer-bottom"></div>
        </div>
        <div class="action-button-group">
          <button class="action-button button-log" data-action="logSet">Log Set</button>
          <button class="action-button button-skip" data-action="skipSet">Skip Set</button>
        </div>`;
  }
}

/**
 * 🔒 CEMENT: Dual-mode side generator
 *
 * Generates complete, self-contained HTML for one side of dual-mode layout.
 * Critical for CSS Grid independence - each side must be architecturally isolated.
 *
 * Spacing: Uses global stack system (--space-m tokens) for consistent 16px rhythm
 * Colors: Timer colors from currentTimerColorClass, skip timers always orange
 */
function getDualModeSideActionHTML(side) {
  const restState = appState.rest.superset[side];

  if (restState.type !== "none") {
    /* 🔒 CEMENT: Dual-mode timers use same color logic as normal timers */
    let colorClass = restState.type === "log"
      ? (appState.session.currentTimerColorClass || appState.session.currentSessionColorClass || 'text-green')
      : "text-orange"; /* Skip timers always orange */
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
    let isDisabled =
      !hasPendingSets ||
      (side === "left" && completedLeft > completedRight) ||
      (side === "right" && completedRight > completedLeft);

    return `<div class="action-button-group">
              <button class="action-button button-log" data-action="logSet" data-side="${side}" ${
      isDisabled ? "disabled" : ""
    }>Log Set</button>
              <button class="action-button button-skip" data-action="skipSet" data-side="${side}" ${
      isDisabled ? "disabled" : ""
    }>Skip Set</button>
            </div>`;
  }
}
