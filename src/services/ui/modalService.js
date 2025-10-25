/* ==========================================================================
   MODAL SERVICE - Generic Modal State Management

   Centralized modal open/close logic with focus trap integration and stack
   management for nested modals. Handles selector cleanup and focus restoration.

   🔒 CEMENT: Single source of truth for modal operations
   - Stacking support allows modals to open on top of existing modals
   - Focus trap activation/deactivation on open/close
   - Automatic selector cleanup on modal close prevents stuck muted states

   Dependencies: appState, focusTrapService, selectorService
   Used by: navigationService, reset modal, superset modal, partner modal, config modal
   ========================================================================== */

import { appState } from "state";
import * as focusTrapService from "lib/focusTrap.js";
import * as selectorService from "services/ui/selectorService.js";

let _renderAll = null;
let _renderModalsOnly = null;
let modalStack = []; // Track modal stack for nested modals
let currentModalSkipsPageRender = false; // Track if current modal used skipPageRender

export function initialize(renderAll, renderModalsOnly) {
  _renderAll = renderAll;
  _renderModalsOnly = renderModalsOnly;
}

/**
 * CEMENTED
 * The definitive function for opening any generic modal in the application.
 * It centralizes all necessary state changes, UI updates, and accessibility
 * features (focus trapping).
 * @param {string} modalName - The name of the modal to open (e.g., 'superset').
 * @param {boolean} allowStacking - If true, allows opening modal on top of existing modal
 * @param {boolean} skipPageRender - If true, only renders modals without reloading the page
 */
export function open(modalName, allowStacking = false, skipPageRender = false) {
  // If stacking is not allowed and there's already a modal, prevent opening
  if (!allowStacking && appState.ui.activeModal) return;

  // If stacking is allowed, push current modal to stack
  if (allowStacking && appState.ui.activeModal) {
    modalStack.push(appState.ui.activeModal);
  }

  selectorService.closeAll();
  if (modalStack.length === 0) {
    appState.ui.modal.elementToFocusOnClose = document.activeElement;
  }
  appState.ui.activeModal = modalName;
  document.documentElement.classList.add("is-modal-open");
  document.documentElement.setAttribute("data-active-modal", modalName);

  // Track if this modal skips page render (for close() to use)
  currentModalSkipsPageRender = skipPageRender;

  // Render modals only (fast, no page reload) or full page render
  if (skipPageRender && _renderModalsOnly) {
    _renderModalsOnly();
  } else {
    _renderAll();
  }

  // Activate focus trap after the DOM has been updated
  requestAnimationFrame(() => {
    const modalContent = document.querySelector(
      `[data-modal-name="${modalName}"] .superset-modal-content`
    );
    if (modalContent) {
      focusTrapService.activate(modalContent);
    }
  });
}

/**
 * CEMENTED
 * The definitive function for closing any active generic modal. It centralizes
 * all teardown logic, including state changes, UI updates, and focus restoration.
 * If there are stacked modals, returns to the previous modal in the stack.
 */
export function close() {
  if (!appState.ui.activeModal) return;

  // If there are stacked modals, pop the previous modal and reopen it
  if (modalStack.length > 0) {
    const previousModal = modalStack.pop();
    appState.ui.activeModal = previousModal;
    document.documentElement.setAttribute("data-active-modal", previousModal);

    _renderAll();

    // Reactivate focus trap for previous modal
    requestAnimationFrame(() => {
      const modalContent = document.querySelector(
        `[data-modal-name="${previousModal}"] .superset-modal-content`
      );
      if (modalContent) {
        focusTrapService.activate(modalContent);
      }
    });
    return;
  }

  // No stacked modals, fully close
  const wasSkippingPageRender = currentModalSkipsPageRender;

  appState.ui.activeModal = null;
  document.documentElement.classList.remove("is-modal-open");
  document.documentElement.removeAttribute("data-active-modal");

  // Reset the skip flag
  currentModalSkipsPageRender = false;

  // Render modals only (fast, no page reload) or full page render
  if (wasSkippingPageRender && _renderModalsOnly) {
    _renderModalsOnly();
  } else {
    _renderAll();
  }

  focusTrapService.deactivate();
  appState.ui.modal.elementToFocusOnClose?.focus();
  appState.ui.modal.elementToFocusOnClose = null;
  
  // FIX: Clean up selector states after modal closes
  // This prevents selectors from being stuck in muted state after 
  // dismissing modal via background click
  requestAnimationFrame(() => {
    // Remove any lingering muted states from selectors
    document.querySelectorAll('.app-selector.is-muted').forEach(selector => {
      // Only remove muted state if there's no reason to keep it
      // (e.g., no workout sets have been logged)
      const shouldStayMuted = appState.session.workoutLog?.some(
        log => log.status !== "pending"
      );
      
      if (!shouldStayMuted) {
        selector.classList.remove('is-muted');
        selector.classList.remove('is-content-muted');
      }
    });
    
    // Ensure body state is clean
    document.body.classList.remove('is-selector-open');
  });
}