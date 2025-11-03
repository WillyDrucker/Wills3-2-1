import { appState } from "state";
import { ui } from "ui";
import { getWorkoutSelectorHTML } from "./config-card.template.plan.js";
import { getDaySelectorHTML } from "./config-card.template.day.js";
import { getTimeSelectorHTML } from "./config-card.template.time.js";

/* ==========================================================================
   CONFIG MODAL - Full configuration modal rendering

   Renders config modal to #config-modal-container when activeModal is 'config'.

   Dependencies: appState, ui, config-card.template.plan, config-card.template.day,
                 config-card.template.time
   Used by: actionHandlers (modal rendering)
   ========================================================================== */

export function renderConfigModal() {
  if (!ui.configModalContainer) return;

  if (appState.ui.activeModal === "config") {
    const isAnySetLogged = appState.session.workoutLog.some(
      (log) => log.status !== "pending"
    );

    ui.configModalContainer.classList.remove("is-hidden");
    ui.configModalContainer.innerHTML = `
      <div class="superset-modal-backdrop" data-action="closeConfigModal"></div>
      <div class="superset-modal-content card" id="config-modal">
        <div class="card-content-container">
          <div class="config-group">
            <h2 class="card-header">Current Workout</h2>
            ${getWorkoutSelectorHTML(isAnySetLogged, "config-modal-workout-selector", false)}
          </div>

          <div class="config-group">
            <h2 class="card-header">Current Focus</h2>
            ${getDaySelectorHTML(isAnySetLogged, "config-modal-day-selector")}
          </div>

          <div class="config-group">
            <h2 class="card-header">Current Session</h2>
            ${getTimeSelectorHTML(isAnySetLogged, "config-modal-time-selector")}
          </div>

          <div class="config-modal-actions">
            <button class="action-button button-cancel" data-action="cancelConfigModal">Cancel</button>
            <button class="action-button button-rest-skip" data-action="resetToDefaults">Defaults</button>
            <button class="action-button button-log" data-action="confirmConfigModal">Confirm</button>
          </div>
        </div>
      </div>
    `;
  } else {
    ui.configModalContainer.classList.add("is-hidden");
    ui.configModalContainer.innerHTML = "";
  }
}
