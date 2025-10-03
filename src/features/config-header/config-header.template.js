import { appState } from "state";
import { workoutPlans, timeOptions } from "config";
import { createSelectorHTML } from "ui";
import { canCycleToSession } from "utils/sessionValidation.js";
import { getDaySelectorHTML } from "../config-card/config-card.templates.daySelector.js";

function canCycleNext() {
  const currentIndex = timeOptions.findIndex((t) => t.name === appState.session.currentTimeOptionName);
  if (currentIndex >= timeOptions.length - 1) return false;
  const nextOption = timeOptions[currentIndex + 1];
  return canCycleToSession(nextOption.name);
}

function canCyclePrevious() {
  const currentIndex = timeOptions.findIndex((t) => t.name === appState.session.currentTimeOptionName);
  if (currentIndex <= 0) return false;
  const prevOption = timeOptions[currentIndex - 1];
  return canCycleToSession(prevOption.name);
}

// Helper: Get icon for current session type
function getSessionIcon() {
  const currentTime = timeOptions.find((t) => t.name === appState.session.currentTimeOptionName) || timeOptions[0];
  if (currentTime.name.includes("Express")) return "⚡";
  if (currentTime.name.includes("Maintenance")) return "🔧";
  return "🎯"; // Standard
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

  // Arms - flexed bicep
  if (muscleGroup.toLowerCase().includes("arm")) {
    return `<img src="/icons/muscle-groups/arms.png?v=4" alt="Arms" width="${iconSize}" height="${iconSize}" style="display: block; object-fit: contain;" onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '💪');">`;
  }

  // Chest - dual pecs
  if (muscleGroup.toLowerCase().includes("chest")) {
    return `<img src="/icons/muscle-groups/chest.png" alt="Chest" width="${iconSize}" height="${iconSize}" style="display: block;">`;
  }

  // Back - spine/lats
  if (muscleGroup.toLowerCase().includes("back")) {
    return `<img src="/icons/muscle-groups/back.png" alt="Back" width="${iconSize}" height="${iconSize}" style="display: block;">`;
  }

  // Legs - quad/hamstring
  if (muscleGroup.toLowerCase().includes("leg")) {
    return `<img src="/icons/muscle-groups/legs.png" alt="Legs" width="${iconSize}" height="${iconSize}" style="display: block;">`;
  }

  // Shoulders - delts
  if (muscleGroup.toLowerCase().includes("shoulder")) {
    return `<img src="/icons/muscle-groups/shoulders.png" alt="Shoulders" width="${iconSize}" height="${iconSize}" style="display: block;">`;
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
  // Stacked layout: minutes on top (colored), "Remain" below (same color)
  return `<div class="session-quick-button-stack"><span class="${session.currentSessionColorClass}">${timeMinutes} Mins</span><span class="${session.currentSessionColorClass}">Remain</span></div>`;
}

// Collapsed state template - minimal icon bar
function getCollapsedTemplate() {
  return `
    <div class="card" id="config-header">
      <div class="card-content-container">
        <div class="config-header-group collapsed">
          <div class="card-header-line">
            <h2 class="card-header">Current Setup</h2>
            <span class="card-header-clock">${appState.ui.currentTime}</span>
          </div>
          <div class="icon-bar">
            <button class="icon-bar-item icon-plan-wide" data-action="toggleConfigHeader" aria-label="Plan">
              <span class="plan-text">${getAbbreviatedPlanText()}</span>
            </button>
            <button class="icon-bar-item icon-display" data-action="toggleConfigHeader" aria-label="Body Part">
              ${getMuscleGroupIcon()}
            </button>
            <button class="icon-bar-item icon-session-wide" data-action="toggleConfigHeader" aria-label="Session Minutes">
              <span class="session-text">${getSessionTimeText()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Expanded state template - full controls
function getExpandedTemplate() {
  const isAnySetLogged = appState.session.workoutLog.some(
    (log) => log.status !== "pending"
  );

  // Determine current setup display
  const { superset, partner, session } = appState;
  let summaryHtml;

  if (superset.isActive) {
    const day1Info = appState.weeklyPlan[superset.day1];
    const day2Info = appState.weeklyPlan[superset.day2];
    summaryHtml = `<div class="selector-content multi-line"><div class="item-main-line flex-line-container"><div class="flex-truncate-group-rigid"><span class="flex-priority">Superset:&nbsp;</span><span class="data-highlight text-plan">${day1Info.title}</span><span class="flex-priority text-on-surface-medium">&nbsp;&amp;&nbsp;</span></div><span class="truncate-text data-highlight text-warning">${day2Info.title}</span></div></div>`;
  } else if (partner.isActive) {
    summaryHtml = `<div class="selector-content multi-line"><div class="item-main-line flex-line-container"><div class="flex-truncate-group-rigid"><span class="flex-priority">Partner:&nbsp;</span><span class="data-highlight text-plan">${partner.user1Name}</span><span class="flex-priority text-on-surface-medium">&nbsp;&amp;&nbsp;</span></div><span class="truncate-text data-highlight text-primary">${partner.user2Name}</span></div></div>`;
  } else {
    // Normal mode: Single-line format with full plan name and duration
    const currentPlan = workoutPlans.find((p) => p.name === session.currentWorkoutPlanName) || workoutPlans[0];
    summaryHtml = `<div class="selector-content"><span class="truncate-text">${currentPlan.name.replace(':', '')}: <span class="data-highlight text-plan">${currentPlan.duration}</span></span></div>`;
  }

  // Build options list
  const options = [];

  // Mode options (Superset and Partner)
  const isModeChangeDisabled = isAnySetLogged && (superset.isActive || partner.isActive);

  options.push(
    `<li class="${isModeChangeDisabled ? "is-muted" : ""}" data-action="openSupersetModal"><div class="selector-content multi-line balanced-text"><span class="truncate-text">Superset Mode:</span><span class="truncate-text text-warning">Two Body Parts, Same Day</span></div></li>`
  );

  options.push(
    `<li class="${isModeChangeDisabled ? "is-muted" : ""}" data-action="openPartnerMode"><div class="selector-content multi-line balanced-text"><span class="truncate-text">Partner Mode:</span><span class="truncate-text text-primary">Two People, Same Workout</span></div></li>`
  );

  // Current Session display
  const currentTime = timeOptions.find((t) => t.name === session.currentTimeOptionName) || timeOptions[0];
  const timeMinutes = appState.session.workoutTimeRemaining;
  const timeText = timeMinutes === 1 ? "Min" : "Mins";

  // 🔒 CEMENT: Chevron disabled states based on validation
  const isLeftDisabled = !canCyclePrevious();
  const isRightDisabled = !canCycleNext();

  return `
    <div class="card" id="config-header">
      <div class="card-content-container">
        <div class="config-header-group expanded">
          <div class="card-header-line">
            <h2 class="card-header">Current Setup</h2>
            <span class="card-header-clock">${appState.ui.currentTime}</span>
          </div>
          <div class="icon-bar">
            <button class="icon-bar-item icon-plan-wide" data-action="toggleConfigHeader" aria-label="Plan">
              <span class="plan-text">${getAbbreviatedPlanText()}</span>
            </button>
            <button class="icon-bar-item icon-display" data-action="toggleConfigHeader" aria-label="Body Part">
              ${getMuscleGroupIcon()}
            </button>
            <button class="icon-bar-item icon-session-wide" data-action="toggleConfigHeader" aria-label="Session Minutes">
              <span class="session-text">${getSessionTimeText()}</span>
            </button>
          </div>
          <div class="config-header-expanded-content">
            <div style="margin-top: -1px;">
              <div class="card-header-line">
                <h2 class="card-header">Current Plan</h2>
              </div>
              ${createSelectorHTML(
                "current-plan-selector",
                summaryHtml,
                options.join(""),
                false,
                isAnySetLogged && (superset.isActive || partner.isActive)
              )}
            </div>
            <div style="margin-top: 13px;">
              <div class="card-header-line">
                <h2 class="card-header">Current Focus</h2>
              </div>
              ${getDaySelectorHTML(isAnySetLogged)}
            </div>
            <div class="current-session-display">
              <button class="session-chevron session-chevron-left ${isLeftDisabled ? 'is-disabled' : ''}" data-action="cyclePreviousSession" aria-label="Previous session" ${isLeftDisabled ? 'disabled' : ''}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M20 24L12 16L20 8" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="current-session-text">
                <span class="session-label">${currentTime.name}&nbsp;</span>
                <span class="session-value ${session.currentSessionColorClass}">${timeMinutes} ${timeText}</span>
              </div>
              <button class="session-chevron session-chevron-right ${isRightDisabled ? 'is-disabled' : ''}" data-action="cycleNextSession" aria-label="Next session" ${isRightDisabled ? 'disabled' : ''}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M12 8L20 16L12 24" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <div class="config-header-actions">
              <button class="config-action-button cancel-button" data-action="toggleConfigHeader">Cancel</button>
              <button class="config-action-button reset-button" data-action="openResetConfirmationModal">Reset Settings</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function getConfigHeaderTemplate() {
  return appState.ui.isConfigHeaderExpanded ? getExpandedTemplate() : getCollapsedTemplate();
}