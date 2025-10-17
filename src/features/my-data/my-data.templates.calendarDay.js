/* ==========================================================================
   MY DATA - Calendar Day Builder

   Processes a single day for calendar view: finds workouts, groups exercises,
   orders by type (normal/left/right superset), builds HTML sections.

   Dependencies: appState, colorCodeMap, isDateInFuture, buildExerciseBlocksHTML
   Used by: my-data.templates.calendarView.js
   ========================================================================== */

import { appState } from "state";
import { colorCodeMap } from "config";
import { isDateInFuture } from "utils";
import { buildExerciseBlocksHTML } from "./my-data.templates.calendarExercise.js";

export function buildDaySectionHTML(day, index, daysOfWeek, hasWideResults) {
  const dayStart = day.date.setHours(0, 0, 0, 0);
  const dayEnd = day.date.setHours(23, 59, 59, 999);

  /* Find all workout sessions for this day */
  const workoutsForDay = appState.user.history.workouts.filter(
    (session) => {
      const sessionDate = new Date(session.timestamp).getTime();
      return sessionDate >= dayStart && sessionDate <= dayEnd;
    }
  );

  let dayContentHtml = "";
  let isPlaceholder = true;

  if (workoutsForDay.length > 0) {
    isPlaceholder = false;

    /* Process each workout session */
    dayContentHtml = workoutsForDay
      .map((session, sessionIndex) => {
        /* Color coding for body parts */
        const bodyPartColorClass =
          colorCodeMap[session.bodyPartColorKey] || "text-plan";
        const bodyPart2ColorClass =
          colorCodeMap[session.bodyPart2ColorKey] || "text-warning";

        /* Build header with color-coded body parts */
        let sessionHeaderHtml;
        if (session.bodyPart.includes("&")) {
          const [part1, part2] = session.bodyPart.split("&");
          sessionHeaderHtml = `<div class="day-name day-workout-name">${
            day.dayName
          }: <span class="${bodyPartColorClass}">${part1.trim()}</span><span class="text-on-surface-medium"> & </span><span class="${bodyPart2ColorClass}">${part2.trim()}</span></div>`;
        } else {
          sessionHeaderHtml = `<div class="day-name day-workout-name">${day.dayName}: <span class="${bodyPartColorClass}">${session.bodyPart}</span></div>`;
        }

        /* Group exercises by name with metadata */
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

        /* Sort sets within each exercise by set number */
        for (const exerciseName in exercisesGrouped) {
          exercisesGrouped[exerciseName].logs.sort(
            (a, b) => a.setNumber - b.setNumber
          );
        }

        /* Group exercises by type for proper ordering: Normal → Left → Right */
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

        /* Combine in proper order */
        const orderedExercises = [...normalExercises, ...leftExercises, ...rightExercises];

        /* Build exercise HTML blocks */
        const exerciseBlocksHtml = buildExerciseBlocksHTML(orderedExercises, session, hasWideResults);

        /* Add session divider if multiple workouts in same day */
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
    /* Show placeholder for empty days */
    const dayHeaderHtml = `<div class="day-card-header history-day-header"><div class="day-name day-empty-name">${day.dayName}</div><span class="date-text history-date-text data-highlight text-plan">${day.dateString}</span></div>`;
    const placeholderText = isDateInFuture(day.date)
      ? "Remaining Workout Day"
      : "No Workouts Logged";
    dayContentHtml = `
        ${dayHeaderHtml}
        <p class="day-card-placeholder-text history-placeholder-text">${placeholderText}</p>
    `;
  }

  /* Day divider between days */
  const separator =
    index < daysOfWeek.length - 1
      ? '<div class="modal-divider history-day-divider"></div>'
      : "";

  return `<div class="day-section history-day-section">${dayContentHtml}</div>${separator}`;
}
