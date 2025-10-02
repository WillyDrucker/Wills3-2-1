import { appState } from "state";
import { ui } from "ui";
import { timeOptions } from "config";
import { getConfigHeaderTemplate } from "./config-header.template.js";
import { handleTimeChange } from "features/config-modal/config-modal.index.js";
import { canCycleToSession } from "utils/sessionValidation.js";
import * as persistenceService from "services/persistenceService.js";

// Click-outside handler for auto-collapsing config-header
let ignoreNextOutsideClick = false;

function handleClickOutside(event) {
  // Only active when config-header is expanded
  if (!appState.ui.isConfigHeaderExpanded) return;

  const configHeaderCard = document.getElementById('config-header');
  if (!configHeaderCard) return;

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
export function renderSessionDisplay() {
  const currentTime = timeOptions.find((t) => t.name === appState.session.currentTimeOptionName) || timeOptions[0];
  const timeMinutes = appState.session.workoutTimeRemaining;
  const timeText = timeMinutes === 1 ? "Min" : "Mins";

  // Update session display in expanded content (if expanded)
  const sessionLabelElement = document.querySelector(".current-session-text .session-label");
  const sessionValueElement = document.querySelector(".current-session-text .session-value");

  if (sessionLabelElement && sessionValueElement) {
    // Update text content only (no innerHTML = no animation restart)
    sessionLabelElement.textContent = `${currentTime.name}\u00A0`; // \u00A0 is &nbsp;
    sessionValueElement.textContent = `${timeMinutes} ${timeText}`;

    // Update color class on session value
    sessionValueElement.className = `session-value ${appState.session.currentSessionColorClass}`;
  }

  // Update session quick button in icon bar (always visible)
  const sessionQuickButton = document.querySelector(".icon-bar-item.icon-session-wide .session-text");
  if (sessionQuickButton) {
    sessionQuickButton.textContent = `${timeMinutes} Mins`;
    sessionQuickButton.className = `session-text ${appState.session.currentSessionColorClass}`;
  }

  // Update button disabled states (if expanded)
  const leftButton = document.querySelector(".session-chevron-left");
  const rightButton = document.querySelector(".session-chevron-right");

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
}

// Cycle to previous session type (no wrap - stop at Recommended)
export function cyclePreviousSession() {
  if (!canCyclePrevious()) return;

  const currentIndex = timeOptions.findIndex((t) => t.name === appState.session.currentTimeOptionName);
  const prevOption = timeOptions[currentIndex - 1];
  handleTimeChange(prevOption.name);
}