import { appState } from "state";
import { getPlanSelectorHTML } from "./config-card.template.plan.js";
import { getDaySelectorHTML } from "./config-card.template.day.js";
import { getTimeSelectorHTML } from "./config-card.template.time.js";

export function getConfigCardTemplate() {
  const isAnySetLogged = appState.session.workoutLog.some(
    (log) => log.status !== "pending"
  );

  return `
    <div class="card" id="config-card">
      <div class="card-content-container">
        <div class="config-group">
          <h2 class="card-header">Current Setup</h2>
          ${getPlanSelectorHTML(isAnySetLogged, "workout-setup-selector-details", true)}
        </div>

        <div class="config-group">
          <h2 class="card-header">Current Focus</h2>
          ${getDaySelectorHTML(isAnySetLogged, "day-selector-details")}
        </div>

        <div class="config-group">
          <h2 class="card-header">Current Session</h2>
          ${getTimeSelectorHTML(isAnySetLogged, "time-selector-details")}
        </div>
      </div>
    </div>
  `;
}
