/* ==========================================================================
   CANCEL CHANGES MODAL - Business Logic

   Renders Cancel Changes modal for confirming discarding of unsaved changes.
   Generic reusable confirmation modal for cancel actions with unsaved work.

   Architecture:
   - Modal opens when user tries to cancel with unsaved changes
   - Renders when appState.ui.activeModal === "cancelChanges"
   - Provides handlers for decline (No) and confirm (Yes) actions

   Dependencies: appState, ui, getCancelChangesModalTemplate
   Used by: actionHandlers.modals.js (modal actions), main.js (render pipeline)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getCancelChangesModalTemplate } from "./cancel-changes-modal.template.js";

/**
 * Render Cancel Changes modal based on appState.ui.activeModal
 * Shows/hides modal and generates HTML template when active
 */
export function renderCancelChangesModal() {
  const container = ui.cancelChangesModalContainer;
  if (!container) return;

  const isActive = appState.ui.activeModal === "cancelChanges";
  container.classList.toggle("is-hidden", !isActive);

  if (isActive) {
    container.innerHTML = getCancelChangesModalTemplate();
  } else {
    container.innerHTML = "";
  }
}
