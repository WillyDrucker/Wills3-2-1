import { appState } from "state";
import { getCurrentSetupSelectorHTML } from "./config-card.templates.currentSetup.js";
import { getDaySelectorHTML } from "./config-card.templates.daySelector.js";
import { getTimeSelectorHTML } from "./config-card.templates.timeSelector.js";

export function getConfigCardTemplate() {
  const isAnySetLogged = appState.session.workoutLog.some(
    (log) => log.status !== "pending"
  );

  /*
    REFACTORED (Definitive Grouped Stack System):
    - The headers are restored to semantic H2 tags with the .card-header class.
    - The inner stack now uses the new --space-header-offset token to achieve the
      correct 7px visual gap. This is the final, production-ready version.
  */
  return `
    <div class="card" id="config-card">
      <div class="card-content-container stack">
        <div class="config-group stack" style="--stack-space: var(--space-header-offset);">
          <h2 class="card-header"><span class="truncate-text">Current Setup</span></h2>
          ${getCurrentSetupSelectorHTML(isAnySetLogged)}
        </div>

        <div class="config-group stack" style="--stack-space: var(--space-header-offset);">
          <h2 class="card-header"><span class="truncate-text">Current Focus</span></h2>
          ${getDaySelectorHTML(isAnySetLogged)}
        </div>

        <div class="config-group stack" style="--stack-space: var(--space-header-offset);">
          <h2 class="card-header"><span class="truncate-text">Current Session</span></h2>
          ${getTimeSelectorHTML(isAnySetLogged)}
        </div>
      </div>
    </div>
  `;
}