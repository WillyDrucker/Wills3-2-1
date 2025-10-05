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
let modalStack = []; // Track modal stack for nested modals

export function initialize(renderAll) {
  _renderAll = renderAll;
}

/**
 * CEMENTED
 * The definitive function for opening any generic modal in the application.
 * It centralizes all necessary state changes, UI updates, and accessibility
 * features (focus trapping).
 * @param {string} modalName - The name of the modal to open (e.g., 'superset').
 * @param {boolean} allowStacking - If true, allows opening modal on top of existing modal
 */
export function open(modalName, allowStacking = false) {
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

  _renderAll();

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
  appState.ui.activeModal = null;
  document.documentElement.classList.remove("is-modal-open");

  _renderAll();

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