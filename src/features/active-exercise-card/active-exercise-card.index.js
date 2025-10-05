import { appState } from "state";
import { ui } from "ui";
import { getActiveExerciseCardTemplate } from "./active-exercise-card.template.js";
import { initializeNumberInputHandlers } from "./active-exercise-card.numberInputHandler.js";
import { handleNumberInputChange } from "./active-exercise-card.actions.js";

/* ==========================================================================
   ACTIVE EXERCISE CARD - Main Controller

   Controls the current exercise display including inputs, timers, and actions.
   Handles both normal and dual-mode (superset/partner) workout progression.

   Dependencies: appState, ui, template, actions, numberInputHandler
   Used by: Main render cycle, action service
   ========================================================================== */

// Re-export actions for external use
export {
  handleLogSet,
  handleSkipSet,
  handleSkipRest,
  handleExerciseSwap,
} from "./active-exercise-card.actions.js";
export { handleNumberInputChange };

/* === HEADER RENDERING === */
/* 🔒 CEMENT: Updates only the header portion to avoid full card re-render */
export function renderActiveCardHeader() {
  const headerContainer = document.getElementById("active-card-header");
  if (!headerContainer) return;

  headerContainer.innerHTML = `
    <div class="card-header-line">
      <h2 class="card-header">${appState.session.activeCardHeaderMessage}</h2>
    </div>
  `;
}

/* === FULL CARD RENDERING === */
export function renderActiveExerciseCard() {
  ui.mainContent.innerHTML = getActiveExerciseCardTemplate();
}

/* === EVENT INITIALIZATION === */
export function initializeActiveCardEventListeners() {
  initializeNumberInputHandlers(handleNumberInputChange);
}
