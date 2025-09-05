import { appState } from "state";
import { colorCodeMap, programConfig } from "config";
import {
  isDumbbellExercise,
  getWeekRange,
  getDaysInWeek,
  isDateInFuture,
  pluralize,
} from "utils";

export function getWorkoutCalendarHTML() {
  const { weekOffset } = appState.ui.myDataPage;
  const weekRange = getWeekRange(weekOffset);
  const daysOfWeek = getDaysInWeek(weekOffset);
  let hasWideResults = false; // Flag for dynamic layout

  const daySectionsHtml = daysOfWeek
    .map((day, index) => {
      const dayStart = day.date.setHours(0, 0, 0, 0);
      const dayEnd = day.date.setHours(23, 59, 59, 999);

      const workoutsForDay = appState.user.history.workouts.filter(
        (session) => {
          const sessionDate = new Date(session.id).getTime();
          return sessionDate >= dayStart && sessionDate <= dayEnd;
        }
      );

      let dayContentHtml = "";
      let dayHeaderHtml = `<div class="day-name">${day.dayName}</div>`;
      let isPlaceholder = true;

      if (workoutsForDay.length > 0) {
        isPlaceholder = false;

        dayContentHtml = workoutsForDay
          .map((session, sessionIndex) => {
            const bodyPartColorClass =
              colorCodeMap[session.bodyPartColorKey] || "text-plan";
            const bodyPart2ColorClass =
              colorCodeMap[session.bodyPart2ColorKey] || "text-warning";
            let sessionHeaderHtml;
            if (session.bodyPart.includes("&")) {
              const [part1, part2] = session.bodyPart.split("&");
              sessionHeaderHtml = `<div class="day-name">${
                day.dayName
              }: <span class="${bodyPartColorClass}">${part1.trim()}</span><span class="text-on-surface-medium"> & </span><span class="${bodyPart2ColorClass}">${part2.trim()}</span></div>`;
            } else {
              sessionHeaderHtml = `<div class="day-name">${day.dayName}: <span class="${bodyPartColorClass}">${session.bodyPart}</span></div>`;
            }

            const currentPlan =
              programConfig[session.planName] || programConfig["Will's 3-2-1:"];

            const logsToRender = [...session.logs];
            logsToRender.sort((a, b) => {
              const sideA = a.supersetSide || "";
              const sideB = b.supersetSide || "";
              if (sideA < sideB) return -1;
              if (sideA > sideB) return 1;

              return session.logs.indexOf(a) - session.logs.indexOf(b);
            });

            const sessionLogHtml = logsToRender
              .map((log) => {
                let exerciseColorClass;
                if (log.supersetSide) {
                  exerciseColorClass =
                    log.supersetSide === "left" ? "text-plan" : "text-warning";
                } else {
                  exerciseColorClass =
                    colorCodeMap[log.exercise[currentPlan.colorKey]] ||
                    "text-plan";
                }

                const isDumbbell = isDumbbellExercise(log.exercise);
                if (isDumbbell) hasWideResults = true;
                const repsUnit = isDumbbell ? " (ea.)" : "";
                const resultText =
                  log.status === "skipped"
                    ? `<span class="text-orange">Skipped</span>`
                    : `<div class="log-item-results-container">
                        <span class="log-item-results-value">${
                          log.weight
                        }</span>
                        <span class="log-item-results-unit">&nbsp;${pluralize(
                          log.weight,
                          "lb",
                          "lbs"
                        )}</span>
                        <span class="log-item-results-unit">&nbsp;x&nbsp;</span>
                        <span class="log-item-results-value">${log.reps}</span>
                        <span class="log-item-results-unit">&nbsp;${pluralize(
                          log.reps,
                          "rep",
                          "reps"
                        )}${repsUnit}</span>
                      </div>`;
                const totalSets = log.exercise.sets;

                /*
                  CEMENTED (Visual Consistency & Color Authority):
                  The layout and class structure of this historical log item MUST mirror the
                  cemented pattern defined in the active workout-log feature. The set
                  count color is correctly sourced from the persisted session data,
                  upholding the single source of truth principle.
                */
                const setInfoHtml = `<div class="log-item-set-info-container">
                    <span class="log-item-set-info-value data-highlight ${session.sessionColorClass}">${log.setNumber}</span>
                    <span class="log-item-set-info-label">&nbsp;of&nbsp;</span>
                    <span class="log-item-set-info-value data-highlight ${session.sessionColorClass}">${totalSets}</span>
                </div>`;

                return `<div class="history-log-item">
                      <span class="log-item-exercise-name ${exerciseColorClass} truncate-text">${log.exercise.exercise_name}</span>
                      <div class="history-log-item-right">
                        ${setInfoHtml}
                        <div class="log-item-results">${resultText}</div>
                      </div>
                    </div>`;
              })
              .join("");

            const sessionSeparator =
              sessionIndex < workoutsForDay.length - 1
                ? '<hr class="history-session-divider">'
                : "";

            return `<div class="day-card-header">
                ${sessionHeaderHtml}
                <span class="data-highlight text-plan">${day.dateString}</span>
            </div>
            ${sessionLogHtml}
            ${sessionSeparator}`;
          })
          .join("");
      } else {
        if (isDateInFuture(day.date)) {
          dayContentHtml = `<p class="day-card-placeholder-text">Remaining Workout Day</p>`;
        } else {
          dayContentHtml = `<p class="day-card-placeholder-text">No Workouts Logged</p>`;
        }
      }

      const separator =
        index < daysOfWeek.length - 1
          ? '<div class="modal-divider"></div>'
          : "";

      const placeholderClass = isPlaceholder ? "is-placeholder" : "";

      return `<div class="day-section ${placeholderClass}">
        ${
          isPlaceholder
            ? `<div class="day-card-header">${dayHeaderHtml}<span class="data-highlight text-plan">${day.dateString}</span></div>`
            : ""
        }
        ${dayContentHtml}
      </div>${separator}`;
    })
    .join("");

  const nextButtonDisabled = weekOffset === 0 ? "disabled" : "";
  const containerClass = hasWideResults ? "has-wide-results" : "";

  return `
    <div class="card" id="workout-history-card">
      <div class="card-header history-week-header">
        <h2>Workout Logs</h2>
        <div class="week-navigator">
          <button class="week-nav-button" data-action="previousWeek">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
          <span class="week-range-text text-plan">${weekRange}</span>
          <button class="week-nav-button" data-action="nextWeek" ${nextButtonDisabled}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </button>
        </div>
      </div>
      <div class="modal-divider"></div>
      <div class="calendar-view-container ${containerClass}">
        ${daySectionsHtml}
      </div>
      <div class="card-footer-action-single">
          <button class="action-button button-rest-skip" data-action="clearHistory">Test Clear History</button>
      </div>
    </div>
    `;
}
