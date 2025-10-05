import { appState } from "state";
import { ui } from "ui";
import { timeOptions } from "config";
import { getConfigHeaderTemplate } from "./config-card.header.template.js";
import { handleTimeChange } from "./config-card.index.js";
import { canCycleToSession } from "utils/sessionValidation.js";
import * as persistenceService from "services/persistenceService.js";
import * as selectorService from "services/selectorService.js";

/* ==========================================================================
   CONFIG HEADER - Collapsible header logic

   Handles config header rendering, click-outside behavior, session cycling,
   and dynamic focus display updates.
   ========================================================================== */

// Click-outside handler for auto-collapsing config-header
let ignoreNextOutsideClick = false;

function handleClickOutside(event) {
  const configHeaderCard = document.getElementById('config-header');
  if (!configHeaderCard) return;

  // If clicking on config area while external selector is open, close the external selector
  // This allows config area clicks to dismiss external selectors without opening config dropdown
  if (configHeaderCard.contains(event.target) && document.body.classList.contains('is-selector-open')) {
    const openExternalSelector = document.querySelector('details[open]:not(#config-header details)');
    if (openExternalSelector) {
      selectorService.closeAll();
      return; // Don't do anything else, just close the external selector
    }
  }

  // Only active when config-header is expanded
  if (!appState.ui.isConfigHeaderExpanded) return;

  // Don't close if locked (during selector operations)
  if (appState.ui.configHeaderLocked) return;

  // Ignore if flag is set AND clicking outside the card
  // (This prevents closing on the same click that opened, but allows clicks inside)
  if (ignoreNextOutsideClick && !configHeaderCard.contains(event.target)) {
    ignoreNextOutsideClick = false;
    return;
  }
  ignoreNextOutsideClick = false;

  // Don't close if clicking buttons or interactive elements inside config-header
  if (event.target.closest('button') && configHeaderCard.contains(event.target)) {
    return;
  }

  // Don't close if clicking inside selectors (details/summary elements)
  if (event.target.closest('.app-selector') && configHeaderCard.contains(event.target)) {
    return;
  }

  // Check if click is outside the config-header card
  if (!configHeaderCard.contains(event.target)) {
    appState.ui.isConfigHeaderExpanded = false;
    renderConfigHeader();
    persistenceService.saveState();
  }
}

// Setup click-outside listener on first render
let clickListenerAttached = false;

/* === RENDERING === */
export function renderConfigHeader() {
  ui.configSection.innerHTML = getConfigHeaderTemplate();

  // Attach click-outside listener once
  if (!clickListenerAttached) {
    document.addEventListener('click', handleClickOutside);
    clickListenerAttached = true;
  }

  // Clear the ignore flag after render completes
  // This ensures clicks inside the newly rendered content work immediately
  if (ignoreNextOutsideClick) {
    setTimeout(() => {
      ignoreNextOutsideClick = false;
    }, 0);
  }
}

// Called when toggle button is clicked to prevent immediate close
export function notifyConfigHeaderToggled() {
  ignoreNextOutsideClick = true;
}

// 🔒 CEMENT: Updates only the clock display (for clock updates without DOM disruption)
// CRITICAL: Avoid innerHTML updates - they restart ALL animations and lose focus
// Instead, update only textContent property
export function renderConfigHeaderLine() {
  const clockElement = document.querySelector("#config-header .card-header-clock");
  if (!clockElement) return;

  // Update only the clock text content (no innerHTML = no DOM disruption)
  clockElement.textContent = appState.ui.currentTime;
}

// 🔒 CEMENT: Updates only the session display text (for session cycling without animation reset)
// CRITICAL: Avoid innerHTML updates - they restart ALL animations in the document
// Instead, update only textContent and className properties
export function renderSessionDisplay(retries = 10) {
  const currentTime = timeOptions.find((t) => t.name === appState.session.currentTimeOptionName) || timeOptions[0];
  const timeMinutes = appState.session.workoutTimeRemaining;
  const timeText = timeMinutes === 1 ? "Min" : "Mins";

  // Always update session quick button in icon bar (always visible - no retry needed)
  const sessionQuickButtonSpans = document.querySelectorAll(".icon-bar-item.icon-session-wide .session-quick-button-stack > span");
  if (sessionQuickButtonSpans.length === 2) {
    // Update both spans in the stack
    sessionQuickButtonSpans[0].textContent = `${timeMinutes} Mins`;
    sessionQuickButtonSpans[0].className = appState.session.currentSessionColorClass;
    sessionQuickButtonSpans[1].textContent = "Remain";
    sessionQuickButtonSpans[1].className = appState.session.currentSessionColorClass;
  }

  // Update session display in expanded content (if expanded) - with retry logic
  const sessionLabelElement = document.querySelector(".current-session-text .session-label");
  const sessionValueElement = document.querySelector(".current-session-text .session-value");
  const leftButton = document.querySelector(".session-chevron-left");
  const rightButton = document.querySelector(".session-chevron-right");

  // Check if expanded content elements exist
  const expandedElementsExist = sessionLabelElement && sessionValueElement;

  // If elements don't exist and we have retries left, try again after a short delay
  if (!expandedElementsExist && retries > 0) {
    setTimeout(() => renderSessionDisplay(retries - 1), 20);
    return;
  }

  // If elements exist, update them
  if (sessionLabelElement && sessionValueElement) {
    // Update text content only (no innerHTML = no animation restart)
    sessionLabelElement.textContent = `${currentTime.name}\u00A0`; // \u00A0 is &nbsp;
    sessionValueElement.textContent = `${timeMinutes} ${timeText}`;

    // Update color class on session value
    sessionValueElement.className = `session-value ${appState.session.currentSessionColorClass}`;
  }

  // Update button disabled states (if expanded)
  if (leftButton) {
    const isLeftDisabled = !canCyclePrevious();
    if (isLeftDisabled) {
      leftButton.classList.add('is-disabled');
      leftButton.setAttribute('disabled', '');
    } else {
      leftButton.classList.remove('is-disabled');
      leftButton.removeAttribute('disabled');
    }
  }

  if (rightButton) {
    const isRightDisabled = !canCycleNext();
    if (isRightDisabled) {
      rightButton.classList.add('is-disabled');
      rightButton.setAttribute('disabled', '');
    } else {
      rightButton.classList.remove('is-disabled');
      rightButton.removeAttribute('disabled');
    }
  }
}

// 🔒 CEMENT: Updates only the focus icon display (for exercise cycling without animation reset)
// CRITICAL: Avoid innerHTML updates - they restart ALL animations in the document
// Updates the muscle group icon based on current or next exercise bodypart in dual modes
export function renderFocusDisplay() {
  const { superset, partner, session } = appState;

  // Only update in dual modes - normal mode icon doesn't change during workout
  if (!superset.isActive && !partner.isActive) return;

  const focusButton = document.querySelector(".icon-bar-item.icon-display");
  if (!focusButton) return;

  let muscleGroup = "";
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

  // Generate icon HTML based on muscle group
  const iconSize = "45";
  let iconHTML = "";

  if (muscleGroup.toLowerCase().includes("arm")) {
    iconHTML = `<img src="/src/features/config-card/assets/muscle-groups/arms.png?v=4" alt="Arms" width="${iconSize}" height="${iconSize}" style="display: block; object-fit: contain;" onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '💪');">`;
  } else if (muscleGroup.toLowerCase().includes("chest")) {
    iconHTML = `<img src="/src/features/config-card/assets/muscle-groups/chest.png" alt="Chest" width="${iconSize}" height="${iconSize}" style="display: block;">`;
  } else if (muscleGroup.toLowerCase().includes("back")) {
    iconHTML = `<img src="/src/features/config-card/assets/muscle-groups/back.png" alt="Back" width="${iconSize}" height="${iconSize}" style="display: block;">`;
  } else if (muscleGroup.toLowerCase().includes("leg")) {
    iconHTML = `<img src="/src/features/config-card/assets/muscle-groups/legs.png" alt="Legs" width="${iconSize}" height="${iconSize}" style="display: block;">`;
  } else if (muscleGroup.toLowerCase().includes("shoulder")) {
    iconHTML = `<img src="/src/features/config-card/assets/muscle-groups/shoulders.png" alt="Shoulders" width="${iconSize}" height="${iconSize}" style="display: block;">`;
  } else {
    iconHTML = `📋`;
  }

  // Update icon - innerHTML is safe here as we're only updating the icon container, not active card
  focusButton.innerHTML = iconHTML;
}

/* === SESSION CYCLING === */
// Check if next session cycling is allowed
export function canCycleNext() {
  const currentIndex = timeOptions.findIndex((t) => t.name === appState.session.currentTimeOptionName);
  if (currentIndex >= timeOptions.length - 1) return false;
  const nextOption = timeOptions[currentIndex + 1];
  return canCycleToSession(nextOption.name);
}

// Check if previous session cycling is allowed
export function canCyclePrevious() {
  const currentIndex = timeOptions.findIndex((t) => t.name === appState.session.currentTimeOptionName);
  if (currentIndex <= 0) return false;
  const prevOption = timeOptions[currentIndex - 1];
  return canCycleToSession(prevOption.name);
}

// Cycle to next session type (no wrap - stop at Maintenance)
export function cycleNextSession() {
  if (!canCycleNext()) return;

  const currentIndex = timeOptions.findIndex((t) => t.name === appState.session.currentTimeOptionName);
  const nextOption = timeOptions[currentIndex + 1];
  handleTimeChange(nextOption.name);
  // Note: Rendering handled by actionService via targeted renderSessionDisplay()
}

// Cycle to previous session type (no wrap - stop at Standard)
export function cyclePreviousSession() {
  if (!canCyclePrevious()) return;

  const currentIndex = timeOptions.findIndex((t) => t.name === appState.session.currentTimeOptionName);
  const prevOption = timeOptions[currentIndex - 1];
  handleTimeChange(prevOption.name);
  // Note: Rendering handled by actionService via targeted renderSessionDisplay()
}
