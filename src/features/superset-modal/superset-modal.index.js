/* ==========================================================================
   SUPERSET MODAL - Business Logic

   Handles superset workout configuration: day selection, validation, state
   management, and confirmation. Enforces mutual exclusivity with partner mode.

   🔒 CEMENT: Superset/Partner mutual exclusivity
   - Resets partner state completely before activating superset
   - Calculates bonus minutes and time deduction set indexes
   - Restores config header state after modal confirmation

   Dependencies: appState, ui, workoutService, workoutFactoryService,
                 workoutMetricsService, modalService, getNextWorkoutDay
   Used by: actionService (openSupersetMode, confirmSuperset)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getSupersetModalTemplate } from "./superset-modal.template.js";
import { recalculateCurrentStateAfterLogChange } from "services/workout/workoutProgressionService.js";
import { generateSupersetWorkoutLog } from "services/workout/workoutLogGenerationService.js";
import * as workoutMetricsService from "services/workout/workoutMetricsService.js";
import * as modalService from "services/ui/modalService.js";
import { getNextWorkoutDay } from "utils";

export function handleSupersetSelection(selector, day) {
  // Save which labels currently have colors BEFORE re-render
  const primaryLabelHadColor = document.getElementById('primary-focus-label')?.classList.contains('text-plan');
  const secondaryLabelHadColor = document.getElementById('secondary-focus-label')?.classList.contains('text-warning');

  appState.ui.supersetModal.selection[selector] = day;
  if (selector === "day1" && day === appState.ui.supersetModal.selection.day2) {
    appState.ui.supersetModal.selection.day2 = getNextWorkoutDay(day);
  }

  renderSupersetModal();

  // Get both selector displays to preserve colors
  const primaryDisplay = document.querySelector('#superset-primary-focus-selector [data-animation-target]');
  const secondaryDisplay = document.querySelector('#superset-secondary-focus-selector [data-animation-target]');

  // Ensure both selectors have their correct colors after re-render
  if (primaryDisplay) {
    primaryDisplay.classList.remove('text-deviation', 'text-warning');
    primaryDisplay.classList.add('text-plan');
  }
  if (secondaryDisplay) {
    secondaryDisplay.classList.remove('text-deviation', 'text-plan');
    secondaryDisplay.classList.add('text-warning');
  }

  // Restore label colors ONLY if they already had colors (prevents white flash on re-selection)
  const primaryLabel = document.getElementById('primary-focus-label');
  const secondaryLabel = document.getElementById('secondary-focus-label');

  // Only restore colors that were already there - don't add new colors
  if (primaryLabel && primaryLabelHadColor) {
    primaryLabel.classList.add('text-plan');
  }

  if (secondaryLabel && secondaryLabelHadColor) {
    secondaryLabel.classList.add('text-warning');
  }

  // Get the selector being animated
  const selectorContainer = document.querySelector(
    `#superset-${selector === "day1" ? "primary" : "secondary"}-focus-selector`
  );
  const displayText = selectorContainer?.querySelector('[data-animation-target]');

  if (selectorContainer && displayText) {
    const colorTransitionClass =
      selector === "day1"
        ? "is-transitioning-to-green"
        : "is-transitioning-to-yellow";
    const finalColorClass = selector === "day1" ? "text-plan" : "text-warning";
    const labelId = selector === "day1" ? "primary-focus-label" : "secondary-focus-label";
    const labelColorClass = selector === "day1" ? "text-plan" : "text-warning";

    // Both start from olive for identical animation behavior
    displayText.classList.remove('text-plan', 'text-warning');
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

export function handleConfirmSuperset() {
  const { day1, day2 } = appState.ui.supersetModal.selection;
  if (!day1 || !day2 || day1 === day2) return;

  /* 🔒 CEMENT: Mutual exclusivity - reset partner state before activating superset */
  appState.partner.isActive = false;
  appState.partner.user1Day = null;
  appState.partner.user2Day = null;

  appState.superset.isActive = true;
  appState.superset.day1 = day1;
  appState.superset.day2 = day2;

  appState.session.workoutLog =
    generateSupersetWorkoutLog();

  /* 🔒 CEMENT: Bonus minutes calculation for time savings in superset mode */
  const metrics = workoutMetricsService.calculateSupersetWorkoutMetrics(
    appState.superset.day1,
    appState.superset.day2,
    appState.session.currentTimeOptionName
  );
  appState.superset.bonusMinutes = metrics.bonusMinutes;

  /* 🔒 CEMENT: Track which sets get time deduction (last N sets from first day) */
  const firstDaySets = appState.session.workoutLog
    .map((log, index) => (log.supersetSide === "left" ? index : -1))
    .filter((index) => index !== -1);
  appState.superset.timeDeductionSetIndexes = firstDaySets.slice(
    -metrics.bonusMinutes
  );

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

export function renderSupersetModal() {
  const container = ui.supersetModalContainer;
  container.classList.toggle(
    "is-hidden",
    appState.ui.activeModal !== "superset"
  );
  if (appState.ui.activeModal === "superset") {
    container.innerHTML = getSupersetModalTemplate();

    // Setup custom selectors
    const selectors = container.querySelectorAll('.app-selector');
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
        handleSupersetSelection(selectorType, day);

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
