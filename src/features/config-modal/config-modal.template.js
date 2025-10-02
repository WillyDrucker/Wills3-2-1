import { appState } from "state";
import { getCurrentPlanSelectorHTML } from "./config-modal.templates.currentPlan.js";
import { getDaySelectorHTML } from "./config-modal.templates.daySelector.js";
import { getTimeSelectorHTML } from "./config-modal.templates.timeSelector.js";

export function getConfigModalTemplate() {
  const isAnySetLogged = appState.session.workoutLog.some(
    (log) => log.status !== "pending"
  );

  return `
    <div class="superset-modal-backdrop" data-action="closeConfigModal"></div>
    <div class="superset-modal-content card" id="config-modal">
      <div class="card-content-container">
        <div class="config-group">
          <h2 class="card-header">Current Plan</h2>
          ${getCurrentPlanSelectorHTML(isAnySetLogged)}
        </div>

        <div class="config-group">
          <h2 class="card-header">Current Focus</h2>
          ${getDaySelectorHTML(isAnySetLogged)}
        </div>

        <div class="config-group">
          <h2 class="card-header">Current Session</h2>
          ${getTimeSelectorHTML(isAnySetLogged)}
        </div>

        <div class="config-modal-actions">
          <button class="action-button button-cancel" data-action="cancelConfigModal">Cancel</button>
          <button class="action-button button-rest-skip" data-action="resetToDefaults">Defaults</button>
          <button class="action-button button-log" data-action="confirmConfigModal">Confirm</button>
        </div>
      </div>
    </div>
  `;
}