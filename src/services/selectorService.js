import * as scrollService from "services/scrollService.js";
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

export function toggle(detailsElement) {
  const wasOpen = detailsElement.open;

  // One-selector rule: If config dropdown is open, don't allow other selectors to open
  if (!wasOpen) {
    const isInsideConfigHeader = detailsElement.closest("#config-header");
    const isConfigDropdownOpen = appState.ui.isConfigHeaderExpanded;

    // Block opening if config dropdown is open AND this selector is outside config header
    if (isConfigDropdownOpen && !isInsideConfigHeader) {
      return; // Don't allow opening
    }

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
