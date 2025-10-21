/* ==========================================================================
   CONFIG HEADER - Click Handlers

   Handles click-outside behavior for config header auto-collapse.
   Implements cancellation logic when clicking outside the config area.

   Click-Outside Logic:
   - Only active when config header is expanded
   - Respects config header lock (during selector operations)
   - Ignores toggle button click (prevents immediate close)
   - Allows clicks inside config header (buttons, selectors)
   - Cancels changes when clicking outside (same as Cancel button)

   Special Cases:
   - Click config area while external selector open → close external selector
   - Click toggle button → ignore (handled by toggle action)
   - Click inside buttons/selectors → don't close
   - Click outside → cancel changes and revert to snapshot

   Dependencies: appState, selectorService, cancelConfigChanges
   Used by: config-card.header.render.js (attach listener on first render)
   ========================================================================== */

import { appState } from "state";
import * as selectorService from "services/ui/selectorService.js";

// Click-outside tracking
let ignoreNextOutsideClick = false;

// Reference to cancel function (set by main module)
let cancelConfigChangesFn = null;

/**
 * Set cancel function reference
 * @param {Function} cancelFn - cancelConfigChanges function
 */
export function setCancelFunction(cancelFn) {
  cancelConfigChangesFn = cancelFn;
}

/**
 * Get reference to ignoreNextOutsideClick flag
 * Used by render module to clear flag after render
 * @returns {{value: boolean}} Reference object
 */
export function getIgnoreNextOutsideClickRef() {
  return {
    get value() { return ignoreNextOutsideClick; },
    set value(val) { ignoreNextOutsideClick = val; }
  };
}

/**
 * Notify that config header toggle was clicked
 * Prevents immediate close on same click that opened
 */
export function notifyConfigHeaderToggled() {
  ignoreNextOutsideClick = true;
}

/**
 * Handle click-outside to auto-collapse config header
 * @param {Event} event - Click event
 */
export function handleClickOutside(event) {
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
  // Cancel changes and revert to snapshot (same as Cancel button)
  if (!configHeaderCard.contains(event.target) && cancelConfigChangesFn) {
    cancelConfigChangesFn();
  }
}
