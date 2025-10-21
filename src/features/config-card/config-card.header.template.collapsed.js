import { appState } from "state";
import { workoutPlans, timeOptions } from "config";
import { canCycleToSession, isSessionCyclingLocked } from "utils";

/* ==========================================================================
   CONFIG HEADER - Collapsed template (icon bar)

   Quick buttons remain clickable even when muted to expand config dropdown.
   Displays three quick buttons: Plan, Focus, Session

   Dependencies: appState, config (workoutPlans, timeOptions), utils
   Used by: config-card.header.render.js (collapsed state rendering)
   ========================================================================== */

// Helper: Check if next session cycling is allowed
function canCycleNext() {
  const currentIndex = timeOptions.findIndex((t) => t.name === appState.session.currentTimeOptionName);
  if (currentIndex >= timeOptions.length - 1) return false;
  const nextOption = timeOptions[currentIndex + 1];
  return canCycleToSession(nextOption.name);
}

// Helper: Check if previous session cycling is allowed
function canCyclePrevious() {
  const currentIndex = timeOptions.findIndex((t) => t.name === appState.session.currentTimeOptionName);
  if (currentIndex <= 0) return false;
  const prevOption = timeOptions[currentIndex - 1];
  return canCycleToSession(prevOption.name);
}

// Helper: Get muscle group icon based on current exercise bodypart
function getMuscleGroupIcon() {
  const { superset, partner, session } = appState;
  let muscleGroup = "";

  // For dual modes (superset/partner), use current exercise's bodypart
  if (superset.isActive || partner.isActive) {
    const currentLog = session.workoutLog[session.currentLogIndex];
    if (currentLog) {
      // Current exercise available - use its bodypart
      const dayInfo = appState.weeklyPlan[currentLog.exercise.day];
      muscleGroup = dayInfo?.title || currentLog.exercise.body_part || "";
    } else {
      // No current exercise (both timers active/waiting) - find next pending exercise
      const nextPendingLog = session.workoutLog.find(log => log.status === "pending");
      if (nextPendingLog) {
        const dayInfo = appState.weeklyPlan[nextPendingLog.exercise.day];
        muscleGroup = dayInfo?.title || nextPendingLog.exercise.body_part || "";
      }
    }
  } else {
    // For normal mode, get current day's muscle group
    const dayInfo = appState.weeklyPlan[session.currentDayName];
    muscleGroup = dayInfo?.title || "";
  }

  // Image-based icons for different muscle groups
  const iconSize = "45"; // 45px to fill button container

  if (muscleGroup.toLowerCase().includes("arm")) {
    return `<img src="/src/features/config-card/assets/muscle-groups/arms.png?v=4" alt="Arms" width="${iconSize}" height="${iconSize}" style="display: block; object-fit: contain;" onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '💪');">`;
  }
  if (muscleGroup.toLowerCase().includes("chest")) {
    return `<img src="/src/features/config-card/assets/muscle-groups/chest.png" alt="Chest" width="${iconSize}" height="${iconSize}" style="display: block;">`;
  }
  if (muscleGroup.toLowerCase().includes("back")) {
    return `<img src="/src/features/config-card/assets/muscle-groups/back.png" alt="Back" width="${iconSize}" height="${iconSize}" style="display: block;">`;
  }
  if (muscleGroup.toLowerCase().includes("leg")) {
    return `<img src="/src/features/config-card/assets/muscle-groups/legs.png" alt="Legs" width="${iconSize}" height="${iconSize}" style="display: block;">`;
  }
  if (muscleGroup.toLowerCase().includes("shoulder")) {
    return `<img src="/src/features/config-card/assets/muscle-groups/shoulders.png" alt="Shoulders" width="${iconSize}" height="${iconSize}" style="display: block;">`;
  }

  // Default - generic clipboard/plan icon
  return `📋`;
}

// Helper: Get abbreviated plan text for Plan Quick Button
function getAbbreviatedPlanText() {
  const { superset, partner, session } = appState;

  if (superset.isActive) {
    const day1Info = appState.weeklyPlan[superset.day1];
    const day2Info = appState.weeklyPlan[superset.day2];
    // Stacked layout: day1 on top (green), day2 below (yellow)
    return `<div class="plan-quick-button-stack"><span class="data-highlight text-plan">${day1Info.title}</span><span class="data-highlight text-warning">${day2Info.title}</span></div>`;
  } else if (partner.isActive) {
    // Stacked layout: user1 on top (green), user2 below (blue)
    return `<div class="plan-quick-button-stack"><span class="data-highlight text-plan">${partner.user1Name}</span><span class="data-highlight text-primary">${partner.user2Name}</span></div>`;
  } else {
    // Normal mode: "3-2-1" (gray) on top, duration (green) below
    const currentPlan = workoutPlans.find((p) => p.name === session.currentWorkoutPlanName) || workoutPlans[0];
    const durationParts = currentPlan.duration.split(' ');
    const durationNumber = durationParts[0];
    // Abbreviate "Weeks" to "Wks"
    const durationUnit = durationParts[1] ? durationParts[1].replace('Weeks', 'Wks').replace('weeks', 'Wks') : '';
    return `<div class="plan-quick-button-stack"><span class="plan-quick-button-muted">3-2-1</span><span class="data-highlight text-plan">${durationNumber} ${durationUnit}</span></div>`;
  }
}

// Helper: Get session time text for Session Quick Button
function getSessionTimeText() {
  const { session } = appState;
  const timeMinutes = appState.session.workoutTimeRemaining;
  const timeText = timeMinutes === 1 ? "Min" : "Mins";
  // Stacked layout: minutes on top (colored), "Remain" below (same color)
  return `<div class="session-quick-button-stack"><span class="${session.currentSessionColorClass}">${timeMinutes} ${timeText}</span><span class="${session.currentSessionColorClass}">Remain</span></div>`;
}

// Collapsed state template - minimal icon bar
export function getCollapsedTemplate() {
  // 🔒 CEMENT: Check if any set is logged to visually mute plan/focus buttons
  // Buttons remain clickable to open config dropdown even when muted
  const isAnySetLogged = appState.session.workoutLog.some(
    (log) => log.status !== "pending"
  );

  // 🔒 CEMENT: Check if session cycling completely locked (Maintenance lock after 3rd set)
  // Button remains clickable to open config dropdown even when muted
  const isSessionCyclingDisabled = isSessionCyclingLocked();

  return `
    <div class="card" id="config-header">
      <div class="card-content-container">
        <div class="config-header-group collapsed">
          <div class="card-header-line">
            <h2 class="card-header">Current Setup</h2>
            <span class="card-header-clock">${appState.ui.currentTime}</span>
          </div>
          <div class="icon-bar">
            <button class="icon-bar-item icon-plan-wide ${isAnySetLogged ? 'is-muted' : ''}" data-action="toggleConfigHeader" aria-label="Plan">
              <span class="plan-text">${getAbbreviatedPlanText()}</span>
            </button>
            <button class="icon-bar-item icon-display ${isAnySetLogged ? 'is-muted' : ''}" data-action="toggleConfigHeader" aria-label="Body Part">
              ${getMuscleGroupIcon()}
            </button>
            <button class="icon-bar-item icon-session-wide ${isSessionCyclingDisabled ? 'is-muted' : ''}" data-action="toggleConfigHeader" aria-label="Session Minutes">
              <span class="session-text">${getSessionTimeText()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
