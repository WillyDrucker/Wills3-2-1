import { appState } from "state";
import { colorCodeMap, programConfig } from "config";
import {
  isDumbbellExercise,
  getDaysInWeek,
  isDateInFuture,
  pluralize,
} from "utils";

export function getWorkoutCalendarHTML() {
  const { weekOffset } = appState.ui.myDataPage;
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

            const exercisesGrouped = session.logs.reduce((acc, log) => {
              const key = log.exercise.exercise_name;
              if (!acc[key]) {
                acc[key] = [];
              }
              acc[key].push(log);
              return acc;
            }, {});

            for (const exerciseName in exercisesGrouped) {
              exercisesGrouped[exerciseName].sort(
                (a, b) => a.setNumber - b.setNumber
              );
            }

            const exerciseBlocksHtml = Object.keys(exercisesGrouped)
              .map((exerciseName) => {
                const logsForExercise = exercisesGrouped[exerciseName];
                const firstLog = logsForExercise[0];
                let exerciseColorClass;

                if (firstLog.supersetSide) {
                  exerciseColorClass =
                    firstLog.supersetSide === "left"
                      ? "text-plan"
                      : "text-warning";
                } else {
                  exerciseColorClass =
                    colorCodeMap[firstLog.exercise[currentPlan.colorKey]] ||
                    "text-plan";
                }

                const setRowsHtml = logsForExercise
                  .map((log) => {
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
                            <span class="log-item-results-value">${
                              log.reps
                            }</span>
                            <span class="log-item-results-unit">&nbsp;${pluralize(
                              log.reps,
                              "rep",
                              "reps"
                            )}${repsUnit}</span>
                          </div>`;
                    const totalSets = firstLog.exercise.sets;

                    const setInfoHtml = `<span class="log-item-set-info-value data-highlight ${session.sessionColorClass}">${log.setNumber}</span>
                        <span class="log-item-set-info-label">&nbsp;of&nbsp;</span>
                        <span class="log-item-set-info-value data-highlight ${session.sessionColorClass}">${totalSets}</span>`;

                    return `<div class="history-exercise-set-row">
                              <div class="history-set-left">${setInfoHtml}</div>
                              <div class="history-set-right">${resultText}</div>
                           </div>`;
                  })
                  .join("");

                return `<div class="history-exercise-block stack" style="--stack-space: var(--space-s);">
                          <div class="history-exercise-name ${exerciseColorClass}">${exerciseName}</div>
                          <div class="history-set-rows-group stack" style="--stack-space: var(--space-s);">
                            ${setRowsHtml}
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
                        <span class="date-text data-highlight text-plan">${day.dateString}</span>
                    </div>
                    <div class="exercise-list-group stack" style="--stack-space: var(--space-m);">
                        ${exerciseBlocksHtml}
                    </div>
                    ${sessionSeparator}`;
          })
          .join("");
      } else {
        const dayHeaderHtml = `<div class="day-card-header"><div class="day-name">${day.dayName}</div><span class="date-text data-highlight text-plan">${day.dateString}</span></div>`;
        const placeholderText = isDateInFuture(day.date)
          ? "Remaining Workout Day"
          : "No Workouts Logged";
        dayContentHtml = `
            ${dayHeaderHtml}
            <p class="day-card-placeholder-text">${placeholderText}</p>
        `;
      }

      const separator =
        index < daysOfWeek.length - 1
          ? '<div class="modal-divider"></div>'
          : "";

      return `<div class="day-section stack" style="--stack-space: var(--space-m);">${dayContentHtml}</div>${separator}`;
    })
    .join("");

  const containerClass = hasWideResults ? "has-wide-results" : "";

  return `
    <div class="workout-log-content-area stack">
        <div class="calendar-view-container ${containerClass}">
            ${daySectionsHtml}
        </div>
        <div class="card-footer-action-single">
            <button class="action-button button-rest-skip" data-action="clearHistory">Test Clear History</button>
        </div>
    </div>
    `;
}