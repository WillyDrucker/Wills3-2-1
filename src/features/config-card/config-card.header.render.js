/* ==========================================================================
   CONFIG HEADER - Render Functions

   Handles rendering of config header components with animation support:
   - Main config header render with Quick Button animations
   - Config header line updates (clock + session time)
   - Session display updates (time remaining, cycle buttons)
   - Focus display updates (muscle group icon for dual modes)

   Quick Button Animations:
   - Triggered on "Let's Go!" close only (not Cancel)
   - Animates Plan/Focus/Session buttons based on what changed
   - Animations run simultaneously for multiple changes
   - Uses requestAnimationFrame + setTimeout for proper timing

   CRITICAL: Avoid innerHTML updates in timer callbacks
   - Use textContent and className updates only
   - Prevents restarting ALL animations in the document

   Dependencies: appState, ui, getConfigHeaderTemplate, timeOptions,
                 session cycling functions
   Used by: config-card.header.index.js, timer callbacks
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { timeOptions } from "config";
import { getConfigHeaderTemplate } from "./config-card.header.template.js";
import { canCycleNext, canCyclePrevious } from "./config-card.header.session.js";

// Click listener tracking
let clickListenerAttached = false;

/**
 * Render config header with optional Quick Button animations
 * @param {Object|null} animationFlags - {animatePlan, animateFocus, animateSession}
 * @param {Function} attachClickListener - Callback to attach click-outside listener
 * @param {Object} ignoreNextOutsideClickRef - Reference to ignoreNextOutsideClick flag
 */
export function renderConfigHeader(animationFlags = null, attachClickListener, ignoreNextOutsideClickRef) {
  ui.configSection.innerHTML = getConfigHeaderTemplate();

  // Attach click-outside listener once (via callback from main module)
  if (!clickListenerAttached && attachClickListener) {
    attachClickListener();
    clickListenerAttached = true;
  }

  // Clear the ignore flag after render completes
  // This ensures clicks inside the newly rendered content work immediately
  if (ignoreNextOutsideClickRef && ignoreNextOutsideClickRef.value) {
    setTimeout(() => {
      ignoreNextOutsideClickRef.value = false;
    }, 0);
  }

  // Trigger Quick Button animations if changes detected (on "Let's Go!" close)
  if (animationFlags && (animationFlags.animatePlan || animationFlags.animateFocus || animationFlags.animateSession)) {
    // Wait for render to complete, then animate
    requestAnimationFrame(() => {
      const planButton = document.querySelector('.icon-bar-item.icon-plan-wide');
      const focusButton = document.querySelector('.icon-bar-item.icon-display');
      const sessionButton = document.querySelector('.icon-bar-item.icon-session-wide');

      // Apply animation class to changed buttons simultaneously
      if (animationFlags.animatePlan && planButton) {
        planButton.classList.add('is-animating-quick-button');
        setTimeout(() => planButton.classList.remove('is-animating-quick-button'), 600);
      }

      if (animationFlags.animateFocus && focusButton) {
        focusButton.classList.add('is-animating-quick-button');
        setTimeout(() => focusButton.classList.remove('is-animating-quick-button'), 600);
      }

      if (animationFlags.animateSession && sessionButton) {
        sessionButton.classList.add('is-animating-quick-button');
        setTimeout(() => sessionButton.classList.remove('is-animating-quick-button'), 600);
      }
    });
  }
}

/**
 * Update config header line (clock + session time)
 * Called every minute by timer - uses textContent to avoid animation restart
 */
export function renderConfigHeaderLine() {
  const clockElement = document.querySelector("#config-header .card-header-clock");
  if (!clockElement) return;

  // Update clock text content (no innerHTML = no DOM disruption)
  clockElement.textContent = appState.ui.currentTime;

  // Update workout time remaining display (called every 60 seconds by timer)
  renderSessionDisplay();
}

/**
 * Update session display (time remaining + cycle buttons)
 * Uses textContent updates to avoid restarting animations
 * Includes retry logic for expanded content (may not be rendered yet)
 * @param {number} retries - Number of retry attempts (default: 10)
 */
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

/**
 * Update focus icon display (muscle group icon for dual modes)
 * Uses innerHTML for icon updates (safe - only updates icon container, not active card)
 * CRITICAL: Avoid innerHTML updates in active exercise card - they restart animations
 */
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
