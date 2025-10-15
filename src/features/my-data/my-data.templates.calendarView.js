/* ==========================================================================
   MY DATA - Calendar View Orchestrator

   Generates workout calendar HTML with 7 days of history. Orchestrates day
   building and tracks wide results for dumbbell exercises.

   Dependencies: appState, getDaysInWeek, buildDaySectionHTML
   Used by: my-data.template.js (getMyDataPageHTML)
   ========================================================================== */

import { appState } from "state";
import { getDaysInWeek } from "utils";
import { buildDaySectionHTML } from "./my-data.templates.calendarDay.js";

export function getWorkoutCalendarHTML() {
  const { weekOffset } = appState.ui.myDataPage;
  const daysOfWeek = getDaysInWeek(weekOffset);

  /* 🔒 CEMENT: Object wrapper enables pass-by-reference for hasWideResults tracking */
  const hasWideResults = { value: false };

  const daySectionsHtml = daysOfWeek
    .map((day, index) => buildDaySectionHTML(day, index, daysOfWeek, hasWideResults))
    .join("");

  const containerClass = hasWideResults.value ? "has-wide-results" : "";

  return `
    <div class="workout-log-content-area history-content-area">
        <div class="calendar-view-container history-calendar ${containerClass}">
            ${daySectionsHtml}
        </div>
    </div>
    `;
}