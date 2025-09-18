import { appState } from "state";
import { getCurrentSetupSelectorHTML } from "./config-card.templates.currentSetup.js";
import { getDaySelectorHTML } from "./config-card.templates.daySelector.js";
import { getTimeSelectorHTML } from "./config-card.templates.timeSelector.js";

export function getConfigCardTemplate() {
  const isAnySetLogged = appState.session.workoutLog.some(
    (log) => log.status !== "pending"
  );

  return `
    <div class="card" id="config-card">
      <div class="card-content-container">
        <div class="config-group">
          <h2 class="card-header">Current Setup</h2>
          ${getCurrentSetupSelectorHTML(isAnySetLogged)}
        </div>

        <div class="config-group">
          <h2 class="card-header">Current Focus</h2>
          ${getDaySelectorHTML(isAnySetLogged)}
        </div>

        <div class="config-group">
          <h2 class="card-header">Current Session</h2>
          ${getTimeSelectorHTML(isAnySetLogged)}
        </div>
      </div>
    </div>
  `;
}