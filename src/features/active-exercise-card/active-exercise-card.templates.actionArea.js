import { appState } from "state";
import { formatTime } from "utils";

export function getActionAreaHTML() {
  if (appState.superset.isActive || appState.partner.isActive) {
    const isAnySideResting =
      appState.rest.superset.left.type !== "none" ||
      appState.rest.superset.right.type !== "none";
    const promptGlowClass = !isAnySideResting ? "is-glowing" : "";

    // CEMENTED FIX (v5.1.10): The dynamic message is now wrapped in a span with .truncate-text.
    // The parent p tag handles layout, and this inner span handles the text content.
    const topContent = isAnySideResting
      ? `<p class="resting-label"><span class="truncate-text">Resting For:</span></p>`
      : `<p class="action-prompt-text ${promptGlowClass}"><span class="truncate-text">${appState.session.activeCardMessage}</span></p>`;

    const left = getDualModeSideActionHTML("left");
    const right = getDualModeSideActionHTML("right");

    return `<div class="action-area-top" data-action="scrollToActiveCard">${topContent}</div>
            <div class="dual-action-area-container">
              <div class="action-area-cell">${left}</div>
              <div class="action-area-cell">${right}</div>
            </div>`;
  } else if (appState.rest.normal.type !== "none") {
    return `
        <div class="action-area-top" data-action="scrollToActiveCard"><p class="resting-label"><span class="truncate-text">Resting For:</span></p></div>
        <div class="action-area-middle" data-action="scrollToActiveCard">
          <div class="timer-container">
            <p class="timer-display ${
              appState.rest.normal.type === "log"
                ? appState.session.currentSessionColorClass
                : "text-orange"
            }">${formatTime(appState.rest.normal.timeRemaining)}</p>
          </div>
        </div>
        <div class="action-area-bottom">
          <button class="action-button button-rest-skip" data-action="skipRest">Skip Rest</button>
        </div>`;
  } else {
    const glowingClass =
      appState.rest.normal.type === "none" ? "is-glowing" : "";
    // CEMENTED FIX (v5.1.10): The dynamic message is now wrapped in a span with .truncate-text.
    // The parent p tag handles layout, and this inner span handles the text content.
    return `
        <div class="action-area-top" data-action="scrollToActiveCard">
          <p class="action-prompt-text ${glowingClass}"><span class="truncate-text">${appState.session.activeCardMessage}</span></p>
        </div>
        <div class="action-area-bottom">
          <div class="action-button-group">
            <button class="action-button button-log" data-action="logSet">Log Set</button>
            <button class="action-button button-skip" data-action="skipSet">Skip Set</button>
          </div>
        </div>`;
  }
}

/**
 * CEMENTED (v5.0.5 - Architectural Pattern):
 * This function's sole purpose is to generate a complete, self-contained, and
 * architecturally independent block of HTML for a single side of the dual-mode card.
 * This separation is critical for the perfected CSS Grid layout to function correctly.
 */
function getDualModeSideActionHTML(side) {
  const restState = appState.rest.superset[side];

  if (restState.type !== "none") {
    let colorClass = "text-orange";
    if (restState.type === "log") {
      colorClass =
        side === "left"
          ? "text-plan"
          : appState.partner.isActive
          ? "text-primary"
          : "text-warning";
    }
    return `<div class="timer-and-skip-container">
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
