import { appState } from "state";
import * as focusTrapService from "lib/focusTrap.js";
import * as selectorService from "services/selectorService.js";

let _renderAll = null;

export function initialize(renderAll) {
  _renderAll = renderAll;
}

/**
 * CEMENTED
 * The definitive function for opening any generic modal in the application.
 * It centralizes all necessary state changes, UI updates, and accessibility
 * features (focus trapping).
 * @param {string} modalName - The name of the modal to open (e.g., 'superset').
 */
export function open(modalName) {
  if (appState.ui.activeModal) return; // Prevent opening a modal on top of another

  selectorService.closeAll();
  appState.ui.modal.elementToFocusOnClose = document.activeElement;
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
 */
export function close() {
  if (!appState.ui.activeModal) return;

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