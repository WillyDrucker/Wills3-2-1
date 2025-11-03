/* ==========================================================================
   SELECTOR SERVICE - Dropdown State Management

   Manages custom dropdown selector state, scrolling, and group-based opening
   rules. Enforces one-selector-at-a-time policy with group awareness.

   🔒 CEMENT: Selector group isolation
   - Config Group: Config dropdown + internal selectors + modal selectors
   - Exercise Group: Current Exercise selector
   - Log Group: Edit log selectors (weight/reps/notes)
   - Different groups block each other, same group allows toggling

   Dependencies: scrollService, appState
   Used by: actionService, workout log, config card, modals
   ========================================================================== */

import * as scrollService from "services/ui/scrollService.js";
import { appState } from "state";

export function closeAll() {
  document.body.classList.remove("is-selector-open");
  document.querySelectorAll("details").forEach((detail) => {
    const optionsList = detail.querySelector(".options-list");
    if (optionsList) {
      optionsList.classList.remove("is-scrollable");
      optionsList.style.maxHeight = "";
      optionsList.onscroll = null;
    }
    detail.open = false;
  });
}

// Close all selectors EXCEPT those inside the config header (when it's expanded)
export function closeAllExceptConfigHeader() {
  document.body.classList.remove("is-selector-open");
  document.querySelectorAll("details").forEach((detail) => {
    // Skip selectors inside config header if it's expanded
    const isInsideConfigHeader = detail.closest("#config-header");
    if (isInsideConfigHeader) return;

    const optionsList = detail.querySelector(".options-list");
    if (optionsList) {
      optionsList.classList.remove("is-scrollable");
      optionsList.style.maxHeight = "";
      optionsList.onscroll = null;
    }
    detail.open = false;
  });
}

// 🔒 CEMENT: Determine which selector group an element belongs to
function getSelectorGroup(detailsElement) {
  // Config Group: Config dropdown + internal selectors (Current Workout/Focus) + modal selectors
  const isInsideConfigHeader = detailsElement.closest("#config-header");
  const isInsideModal = detailsElement.closest(".superset-modal-container, .config-modal-container");
  if (isInsideConfigHeader || isInsideModal) {
    return "config";
  }

  // Exercise Group: Current Exercise selector
  const isExerciseSelector = detailsElement.id === "exercise-selector";
  if (isExerciseSelector) {
    return "exercise";
  }

  // Log Group: Edit log selectors (weight/reps/notes)
  const isInsideWorkoutLog = detailsElement.closest("#workout-log");
  if (isInsideWorkoutLog) {
    return "log";
  }

  return "unknown";
}

// Get the currently open selector group (if any)
function getOpenSelectorGroup() {
  const openSelector = document.querySelector("details[open]");
  if (!openSelector) return null;
  return getSelectorGroup(openSelector);
}

export function toggle(detailsElement) {
  const wasOpen = detailsElement.open;

  if (!wasOpen) {
    // One-selector-to-rule-them-all: Only one selector GROUP at a time
    const clickedGroup = getSelectorGroup(detailsElement);
    const openGroup = getOpenSelectorGroup();

    if (openGroup && openGroup !== clickedGroup) {
      // Different group is open - close it but don't open this one
      closeAll();
      return; // Don't allow opening yet
    }

    // Same group or no group open - close all and allow toggle below
    closeAll();
  }

  detailsElement.open = !wasOpen;

  if (detailsElement.open) {
    document.body.classList.add("is-selector-open");
    scrollService.handleSelectorOpening(detailsElement);
  } else {
    closeAll();
  }
}
