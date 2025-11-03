/* ==========================================================================
   CONFIG CARD TEMPLATE - Main Config Card HTML Generator

   Generates the main config card container HTML with three selector groups:
   Current Setup (plan), Current Focus (day), and Current Session (time).
   Delegates to specialized template modules for each selector type.

   Dependencies: appState, config-card.template.plan, config-card.template.day,
                 config-card.template.time
   Used by: config-card.index.js (main config card render)
   ========================================================================== */

import { appState } from "state";
import { getWorkoutSelectorHTML } from "./config-card.template.plan.js";
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
          ${getWorkoutSelectorHTML(isAnySetLogged, "workout-setup-selector-details", true)}
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
