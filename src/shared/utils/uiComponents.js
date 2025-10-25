/* ==========================================================================
   UI COMPONENTS - DOM References & Reusable Component Builders

   Central registry of DOM element references and reusable HTML component
   builders. Provides single source of truth for DOM access and consistent
   component generation.

   🔒 CEMENT: DOM element registry
   - All major containers cached on initial load
   - Prevents repeated querySelector calls
   - Single point of reference for DOM manipulation

   Component Builders:
   - createNumberInputHTML: Increment/decrement number inputs
   - createSelectorHTML: Custom dropdown selectors with muting

   Dependencies: None
   Used by: All feature components, main.js, service layer
   ========================================================================== */

/**
 * CEMENTED
 * DOM element registry - cached references to major UI containers
 */
export const ui = {
  appHeader: document.getElementById("app-header"),
  configSection: document.getElementById("config-section"),
  mainContent: document.getElementById("main-content"),
  workoutFooter: document.getElementById("workout-footer-section"),
  videoPlayerModalContainer: document.getElementById(
    "video-player-modal-container"
  ),
  supersetModalContainer: document.getElementById(
    "superset-selection-modal-container"
  ),
  partnerModalContainer: document.getElementById("partner-modal-container"),
  sideNavContainer: document.getElementById("side-nav-container"),
  configModalContainer: document.getElementById("config-modal-container"),
  resetConfirmationModalContainer: document.getElementById(
    "reset-confirmation-modal-container"
  ),
  newWorkoutModalContainer: document.getElementById(
    "new-workout-modal-container"
  ),
  resetOptionsModalContainer: document.getElementById(
    "reset-options-modal-container"
  ),
  editWorkoutModalContainer: document.getElementById(
    "edit-workout-modal-container"
  ),
  deleteLogModalContainer: document.getElementById(
    "delete-log-modal-container"
  ),
  deleteWorkoutModalContainer: document.getElementById(
    "delete-workout-modal-container"
  ),
  cancelChangesModalContainer: document.getElementById(
    "cancel-changes-modal-container"
  ),
};

/**
 * CEMENTED
 * Creates a number input component with increment/decrement buttons.
 * Used for weight and reps inputs in workout logging.
 */
export function createNumberInputHTML(
  id,
  value,
  isEditMode = false,
  logIndex = -1
) {
  const dataAttr = isEditMode ? `data-log-index="${logIndex}"` : "";
  return `
      <div class="number-input-container">
        <button type="button" data-action="decrement" data-input-id="${id}" ${dataAttr}><span class="decrement-button-symbol">-</span></button>
        <input type="number" id="${id}-input" value="${value}" min="0" max="999" readonly ${dataAttr}>
        <button type="button" data-action="increment" data-input-id="${id}" ${dataAttr}>+</button>
      </div>`;
}

/**
 * CEMENTED
 * Creates a custom dropdown selector component with optional muting.
 * Used for day/plan/time/exercise selection throughout the app.
 */
export function createSelectorHTML(
  id,
  summaryHtml,
  optionsHtml,
  isSelectorDisabled = false,
  isContentMuted = false
) {
  const disabledClass = isSelectorDisabled ? "is-muted" : "";
  const contentMutedClass = isContentMuted ? "is-content-muted" : "";
  return `<details class="app-selector ${disabledClass}" id="${id}"><summary class="${contentMutedClass}">${summaryHtml}</summary><ul class="options-list">${optionsHtml}</ul></details>`;
}

/* ==========================================================================
   ARCHIVED COMPONENTS - Saved for potential future reuse
   ========================================================================== */

/**
 * ARCHIVED (2025-10-23)
 * Creates edit pen button for committed workout history entries.
 *
 * HTML Structure:
 * <button class="session-edit-button" data-workout-id="${workoutId}" data-action="openEditWorkoutModal" aria-label="Edit workout history">
 *   <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
 *     <path d="M20 6L26 12M4 28L10 26L25 11C25.5 10.5 26 9.5 26 9C26 8.5 25.5 7.5 25 7L23 5C22.5 4.5 21.5 4 21 4C20.5 4 19.5 4.5 19 5L4 20L4 28Z" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
 *   </svg>
 * </button>
 *
 * CSS (from my-data.selectors.css):
 * .session-edit-button {
 *   width: 50px;
 *   height: 32px;
 *   min-width: 50px;
 *   min-height: 32px;
 *   padding: 0 !important;
 *   margin: 4px 0 9px auto !important;
 *   background: var(--background-dark);
 *   box-shadow: inset 0 0 0 1px var(--on-surface-disabled), 0 2px 6px rgba(0, 0, 0, 0.3);
 *   border: none;
 *   border-radius: var(--border-radius);
 *   color: #ffffff;
 *   cursor: pointer;
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   flex-shrink: 0;
 *   transition: none;
 * }
 *
 * .session-edit-button:disabled {
 *   box-shadow: inset 0 0 0 1px var(--on-surface-disabled), 0 2px 6px rgba(0, 0, 0, 0.3);
 *   color: var(--on-surface-medium);
 *   cursor: default;
 *   opacity: 0.5;
 * }
 *
 * .session-edit-button svg {
 *   width: 24px;
 *   height: 24px;
 * }
 *
 * Action Handler (in actionHandlers.modals.js):
 * - data-action="openEditWorkoutModal" triggers modal open
 * - Requires data-workout-id attribute with workout ID
 * - Preserves scroll position on open/close
 */
