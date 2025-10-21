/* ==========================================================================
   PARTNER MODAL - Business Logic

   Handles partner workout configuration: user day selection, validation, state
   management, and confirmation. Enforces mutual exclusivity with superset mode.

   🔒 CEMENT: Partner/Superset mutual exclusivity
   - Resets superset state completely before activating partner
   - Restores config header state after modal confirmation

   Dependencies: appState, ui, workoutService, workoutFactoryService, modalService
   Used by: actionService (openPartnerMode, confirmPartnerWorkout)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getPartnerModalTemplate } from "./partner-modal.template.js";
import { recalculateCurrentStateAfterLogChange } from "services/workout/workoutProgressionService.js";
import { generatePartnerWorkoutLog } from "services/workout/workoutLogGenerationService.js";
import * as modalService from "services/ui/modalService.js";

export function handlePartnerDaySelection(user, day) {
  // Save which labels currently have colors BEFORE re-render
  const currentUserLabelHadColor = document.getElementById('current-user-focus-label')?.classList.contains('text-plan');
  const partnerLabelHadColor = document.getElementById('partner-focus-label')?.classList.contains('text-primary');

  appState.partner[user] = day;
  renderPartnerModal();

  // Get both selector displays to preserve colors
  const user1Display = document.querySelector('#partner-user1-day-selector [data-animation-target]');
  const user2Display = document.querySelector('#partner-user2-day-selector [data-animation-target]');

  // Ensure both selectors have their correct colors after re-render
  if (user1Display) {
    user1Display.classList.remove('text-deviation', 'text-primary');
    user1Display.classList.add('text-plan');
  }
  if (user2Display) {
    user2Display.classList.remove('text-deviation', 'text-plan');
    user2Display.classList.add('text-primary');
  }

  // Restore label colors ONLY if they already had colors (prevents white flash on re-selection)
  const currentUserLabel = document.getElementById('current-user-focus-label');
  const partnerLabel = document.getElementById('partner-focus-label');

  // Only restore colors that were already there - don't add new colors
  if (currentUserLabel && currentUserLabelHadColor) {
    currentUserLabel.classList.add('text-plan');
  }

  if (partnerLabel && partnerLabelHadColor) {
    partnerLabel.classList.add('text-primary');
  }

  // Get the selector being animated
  const selectorId = user === "user1Day" ? "partner-user1-day-selector" : "partner-user2-day-selector";
  const selectorContainer = document.querySelector(`#${selectorId}`);
  const displayText = selectorContainer?.querySelector('[data-animation-target]');

  if (selectorContainer && displayText) {
    const colorTransitionClass =
      user === "user1Day"
        ? "is-transitioning-to-green"
        : "is-transitioning-to-blue";
    const finalColorClass = user === "user1Day" ? "text-plan" : "text-primary";
    const labelId = user === "user1Day" ? "current-user-focus-label" : "partner-focus-label";
    const labelColorClass = user === "user1Day" ? "text-plan" : "text-primary";

    // Both start from olive for identical animation behavior
    displayText.classList.remove('text-plan', 'text-primary');
    displayText.classList.add('text-deviation');

    // Apply grow/snap animation to entire selector
    selectorContainer.classList.add("is-animating-selector");

    // Apply color transition to display text (runs in parallel with grow animation)
    displayText.classList.add(colorTransitionClass);

    // Clean up after animations complete
    setTimeout(() => {
      selectorContainer.classList.remove("is-animating-selector");
      displayText.classList.remove(colorTransitionClass);
      // Apply final color class to maintain state
      displayText.classList.remove("text-deviation");
      displayText.classList.add(finalColorClass);
      // Clear will-change to prevent rendering issues
      selectorContainer.style.willChange = 'auto';
      displayText.style.willChange = 'auto';

      // Change label text color after animation completes
      const label = document.getElementById(labelId);
      if (label) {
        label.classList.add(labelColorClass);
      }
    }, 1000); // Both grow and glow animations complete at 1000ms
  }
}

export function handleConfirmPartnerWorkout() {
  const { user1Day, user2Day } = appState.partner;
  if (!user1Day || !user2Day) return;

  /* 🔒 CEMENT: Mutual exclusivity - reset superset state before activating partner */
  appState.superset.isActive = false;
  appState.superset.day1 = null;
  appState.superset.day2 = null;
  appState.superset.bonusMinutes = 0;
  appState.superset.timeDeductionSetIndexes = [];

  appState.partner.isActive = true;

  appState.session.workoutLog =
    generatePartnerWorkoutLog();

  recalculateCurrentStateAfterLogChange();

  /* 🔒 CEMENT: Config header state restoration preserves dropdown UX */
  const shouldRestoreExpandedState = appState.ui.wasConfigHeaderExpandedBeforeModal;
  if (shouldRestoreExpandedState) {
    appState.ui.isConfigHeaderExpanded = true;
    appState.ui.wasConfigHeaderExpandedBeforeModal = false;
  }

  modalService.close();

  // Note: Unlock happens AFTER updateActiveWorkoutAndLog() in actionService
}

export function renderPartnerModal() {
  const container = ui.partnerModalContainer;
  container.classList.toggle(
    "is-hidden",
    appState.ui.activeModal !== "partner"
  );
  if (appState.ui.activeModal === "partner") {
    container.innerHTML = getPartnerModalTemplate();

    // Setup custom selectors (only for day selectors, not profile selectors)
    const selectors = container.querySelectorAll('.app-selector:not(#partner-user1-profile-selector):not(#partner-user2-profile-selector)');
    selectors.forEach(selector => {
      const display = selector.querySelector('.selector-display');
      const optionsList = selector.querySelector('.options-list');
      const selectorType = selector.dataset.selectorType;

      // Click display to toggle open/closed
      display.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent immediate close from document click
        const isOpen = selector.classList.contains('is-open');

        // Close all other selectors first
        container.querySelectorAll('.app-selector.is-open').forEach(s => {
          if (s !== selector) s.classList.remove('is-open');
        });

        // Toggle this selector
        selector.classList.toggle('is-open', !isOpen);
      });

      // Click option to select it
      optionsList.addEventListener('click', (e) => {
        const option = e.target.closest('li');
        if (!option || !option.dataset.day) return;

        const day = option.dataset.day;
        handlePartnerDaySelection(selectorType, day);

        // Close selector after selection
        selector.classList.remove('is-open');
      });
    });

    // Click outside to close selectors
    const closeHandler = (e) => {
      const clickedInsideSelector = e.target.closest('.app-selector');
      if (!clickedInsideSelector) {
        container.querySelectorAll('.app-selector.is-open').forEach(selector => {
          selector.classList.remove('is-open');
        });
      }
    };

    // Add document click handler
    document.addEventListener('click', closeHandler);

    // Store handler for cleanup when modal closes
    container._selectorCloseHandler = closeHandler;
  } else {
    // Cleanup when modal closes
    if (container._selectorCloseHandler) {
      document.removeEventListener('click', container._selectorCloseHandler);
      container._selectorCloseHandler = null;
    }
    container.innerHTML = "";
  }
}
