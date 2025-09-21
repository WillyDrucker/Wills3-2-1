import { appState } from "state";
import { colorCodeMap, programConfig } from "config";
import {
  isDumbbellExercise,
  getDaysInWeek,
  isDateInFuture,
  pluralize,
} from "utils";

/**
 * Generates HTML for the workout calendar view
 * Displays 7 days of workout history with proper grouping and ordering
 */
export function getWorkoutCalendarHTML() {
  const { weekOffset } = appState.ui.myDataPage;
  const daysOfWeek = getDaysInWeek(weekOffset);
  let hasWideResults = false; // Triggers wider layout for dumbbell exercises

  const daySectionsHtml = daysOfWeek
    .map((day, index) => {
      const dayStart = day.date.setHours(0, 0, 0, 0);
      const dayEnd = day.date.setHours(23, 59, 59, 999);

      // Find all workout sessions for this day
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

        // Process each workout session
        dayContentHtml = workoutsForDay
          .map((session, sessionIndex) => {
            // Color coding for body parts
            const bodyPartColorClass =
              colorCodeMap[session.bodyPartColorKey] || "text-plan";
            const bodyPart2ColorClass =
              colorCodeMap[session.bodyPart2ColorKey] || "text-warning";
            
            // Build header with color-coded body parts
            let sessionHeaderHtml;
            if (session.bodyPart.includes("&")) {
              const [part1, part2] = session.bodyPart.split("&");
              sessionHeaderHtml = `<div class="day-name day-workout-name">${
                day.dayName
              }: <span class="${bodyPartColorClass}">${part1.trim()}</span><span class="text-on-surface-medium"> & </span><span class="${bodyPart2ColorClass}">${part2.trim()}</span></div>`;
            } else {
              sessionHeaderHtml = `<div class="day-name day-workout-name">${day.dayName}: <span class="${bodyPartColorClass}">${session.bodyPart}</span></div>`;
            }

            const currentPlan =
              programConfig[session.planName] || programConfig["Will's 3-2-1:"];

            // Group exercises by name with metadata
            const exercisesGrouped = session.logs.reduce((acc, log) => {
              const key = log.exercise.exercise_name;
              if (!acc[key]) {
                acc[key] = {
                  logs: [],
                  supersetSide: log.supersetSide || null,
                  exercise: log.exercise
                };
              }
              acc[key].logs.push(log);
              return acc;
            }, {});

            // Sort sets within each exercise by set number
            for (const exerciseName in exercisesGrouped) {
              exercisesGrouped[exerciseName].logs.sort(
                (a, b) => a.setNumber - b.setNumber
              );
            }

            // Group exercises by type for proper ordering
            // Normal -> Left superset -> Right superset
            const leftExercises = [];
            const rightExercises = [];
            const normalExercises = [];

            for (const exerciseName in exercisesGrouped) {
              const exerciseData = exercisesGrouped[exerciseName];
              if (exerciseData.supersetSide === 'left') {
                leftExercises.push({ name: exerciseName, data: exerciseData });
              } else if (exerciseData.supersetSide === 'right') {
                rightExercises.push({ name: exerciseName, data: exerciseData });
              } else {
                normalExercises.push({ name: exerciseName, data: exerciseData });
              }
            }

            // Combine in proper order
            const orderedExercises = [...normalExercises, ...leftExercises, ...rightExercises];

            // Build exercise HTML blocks
            const exerciseBlocksHtml = orderedExercises
              .map(({ name: exerciseName, data: exerciseData }) => {
                const logsForExercise = exerciseData.logs;
                const firstLog = logsForExercise[0];
                
                // Color based on superset side or exercise type
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

                // Build set rows
                const setRowsHtml = logsForExercise
                  .map((log) => {
                    const isDumbbell = isDumbbellExercise(log.exercise);
                    if (isDumbbell) hasWideResults = true;
                    const repsUnit = isDumbbell ? " (ea.)" : "";
                    
                    // Format results or show skipped
                    const resultText =
                      log.status === "skipped"
                        ? `<span class="text-orange history-skipped-text">Skipped</span>`
                        : `<div class="log-item-results-container history-results-container">
                            <span class="log-item-results-value history-results-value">${
                              log.weight
                            }</span>
                            <span class="log-item-results-unit history-results-unit">&nbsp;${pluralize(
                              log.weight,
                              "lb",
                              "lbs"
                            )}</span>
                            <span class="log-item-results-unit history-results-unit">&nbsp;x&nbsp;</span>
                            <span class="log-item-results-value history-results-value">${
                              log.reps
                            }</span>
                            <span class="log-item-results-unit history-results-unit">&nbsp;${pluralize(
                              log.reps,
                              "rep",
                              "reps"
                            )}${repsUnit}</span>
                          </div>`;
                    
                    const totalSets = firstLog.exercise.sets;

                    const setInfoHtml = `<span class="log-item-set-info-value history-set-value data-highlight ${session.sessionColorClass}">${log.setNumber}</span>
                        <span class="log-item-set-info-label history-set-label">&nbsp;of&nbsp;</span>
                        <span class="log-item-set-info-value history-set-value data-highlight ${session.sessionColorClass}">${totalSets}</span>`;

                    return `<div class="history-exercise-set-row history-set-row">
                              <div class="history-set-left">${setInfoHtml}</div>
                              <div class="history-set-right">${resultText}</div>
                           </div>`;
                  })
                  .join("");

                return `<div class="history-exercise-block">
                          <div class="history-exercise-name ${exerciseColorClass}">${exerciseName}</div>
                          <div class="history-set-rows-group">
                            ${setRowsHtml}
                          </div>
                        </div>`;
              })
              .join("");

            // Add session divider if multiple workouts in same day
            const sessionSeparator =
              sessionIndex < workoutsForDay.length - 1
                ? '<hr class="history-session-divider">'
                : "";

            return `<div class="day-card-header history-day-header">
                        ${sessionHeaderHtml}
                        <span class="date-text history-date-text data-highlight text-plan">${day.dateString}</span>
                    </div>
                    <div class="exercise-list-group history-exercise-list">
                        ${exerciseBlocksHtml}
                    </div>
                    ${sessionSeparator}`;
          })
          .join("");
      } else {
        // Show placeholder for empty days
        const dayHeaderHtml = `<div class="day-card-header history-day-header"><div class="day-name day-empty-name">${day.dayName}</div><span class="date-text history-date-text data-highlight text-plan">${day.dateString}</span></div>`;
        const placeholderText = isDateInFuture(day.date)
          ? "Remaining Workout Day"
          : "No Workouts Logged";
        dayContentHtml = `
            ${dayHeaderHtml}
            <p class="day-card-placeholder-text history-placeholder-text">${placeholderText}</p>
        `;
      }

      // Day divider between days
      const separator =
        index < daysOfWeek.length - 1
          ? '<div class="modal-divider history-day-divider"></div>'
          : "";

      return `<div class="day-section history-day-section">${dayContentHtml}</div>${separator}`;
    })
    .join("");

  const containerClass = hasWideResults ? "has-wide-results" : "";

  return `
    <div class="workout-log-content-area history-content-area">
        <div class="calendar-view-container history-calendar ${containerClass}">
            ${daySectionsHtml}
        </div>
        <div class="card-footer-action-single history-footer">
            <button class="action-button button-rest-skip history-clear-button" data-action="clearHistory">Test Clear History</button>
        </div>
    </div>
    `;
}