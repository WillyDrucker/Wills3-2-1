/* ==========================================================================
   MY DATA - Calendar Day Builder

   Processes a single day for calendar view: finds workouts, groups exercises,
   orders by type (normal/left/right superset), builds HTML sections.

   Architecture: Calendar day rendering - Two-line label system
   - Line 1 (Day/Date): "Thursday   Oct 23" - shown once per day (first workout only)
   - Line 2 (Body Part/Completion): "Chest          Completed: 9:45 AM" - shown for each workout
   - All workout sessions wrapped in blue border selector with black background (no headers inside)
   - Workouts sorted chronologically (oldest first)
   - Unlogged workouts use muted border (is-muted class)
   - Sandwich dividers separate days
   - Handles Superset mode with dual color-coded body parts

   Dependencies: appState, colorCodeMap, isDateInFuture, buildExerciseBlocksHTML
   Used by: my-data.templates.calendarView.js
   ========================================================================== */

import { appState } from "state";
import { colorCodeMap, muscleGroupSortOrder } from "config";
import { isDateInFuture } from "utils";
import { buildExerciseBlocksHTML } from "./my-data.templates.calendarExercise.js";

/* Helper function to format timestamp as 12-hour time with AM/PM */
function formatCompletionTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutesStr} ${ampm}`;
}

export function buildDaySectionHTML(day, index, daysOfWeek, hasWideResults) {
  const dayStart = day.date.setHours(0, 0, 0, 0);
  const dayEnd = day.date.setHours(23, 59, 59, 999);

  /* Find all workout sessions for this day, sorted chronologically (oldest first) */
  const workoutsForDay = appState.user.history.workouts
    .filter((session) => {
      const sessionDate = new Date(session.timestamp).getTime();
      return sessionDate >= dayStart && sessionDate <= dayEnd;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let dayContentHtml = "";
  let isPlaceholder = true;

  if (workoutsForDay.length > 0) {
    isPlaceholder = false;

    /* Helper to generate day/date header (shown once per day) */
    const generateDayDateHeader = () => {
      return `<div class="history-day-date-header">
        <span class="history-day-date-text">${day.dayName}</span>
        <span class="history-day-date-date data-highlight text-plan">${day.dateString}</span>
      </div>`;
    };

    /* Helper to generate body part line with completion time (shown for each workout) */
    const generateBodyPartLine = (session) => {
      const bodyPartColorClass = colorCodeMap[session.bodyPartColorKey] || "text-plan";
      const bodyPart2ColorClass = colorCodeMap[session.bodyPart2ColorKey] || "text-warning";
      const completionTime = formatCompletionTime(session.completedTimestamp);

      let bodyPartText;
      if (session.bodyPart.includes("&")) {
        const [part1, part2] = session.bodyPart.split("&");
        bodyPartText = `<span class="${bodyPartColorClass}">${part1.trim()}</span><span class="text-on-surface-medium"> & </span><span class="${bodyPart2ColorClass}">${part2.trim()}</span>`;
      } else {
        bodyPartText = `<span class="${bodyPartColorClass}">${session.bodyPart}</span>`;
      }

      return `<div class="history-body-part-line">
        <span class="history-body-part-text">${bodyPartText}</span>
        <span class="history-completion-text"><span class="history-completion-label">Completed:</span> <span class="history-completion-value">${completionTime}</span></span>
      </div>`;
    };

    /* Process each workout session - first gets day/date header, all get body part line */
    const workoutBlocksHtml = workoutsForDay
      .map((session, sessionIndex) => {

        /* Generate day/date header only for first workout */
        const dayDateHeaderHtml = sessionIndex === 0 ? generateDayDateHeader() : '';

        /* Generate body part line for this workout */
        const bodyPartLineHtml = generateBodyPartLine(session);

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

        /* Sort exercises within each group by muscle_group (same as Edit Workout modal) */
        /* Uses muscleGroupSortOrder: Major1 (1) → Minor1 (2) → Major2 (3) → Minor2 (4) → Tertiary (5) */
        const sortByMuscleGroup = (a, b) => {
          const sortA = muscleGroupSortOrder[a.data.exercise.muscle_group] || 99;
          const sortB = muscleGroupSortOrder[b.data.exercise.muscle_group] || 99;
          return sortA - sortB;
        };
        normalExercises.sort(sortByMuscleGroup);
        leftExercises.sort(sortByMuscleGroup);
        rightExercises.sort(sortByMuscleGroup);

        /* Combine in proper order */
        const orderedExercises = [...normalExercises, ...leftExercises, ...rightExercises];

        /* Build exercise HTML blocks */
        const exerciseBlocksHtml = buildExerciseBlocksHTML(orderedExercises, session, hasWideResults);

        /* Add data attributes for all workouts (committed and uncommitted) to make them selectable */
        /* This allows uncommitted (stale) workouts to be edited via the Edit button */
        const dataAttrs = `data-workout-id="${session.id}" data-action="selectHistoryWorkout"`;

        /* Render Cancel/Edit buttons when selector is active */
        /* Note: Uncommitted workouts are now selectable (fixed stale workout issue) */
        const isActive = appState.ui.selectedHistoryWorkoutId === session.id;
        const hasActiveSelection = appState.ui.selectedHistoryWorkoutId !== null;
        const isMuted = hasActiveSelection && !isActive && session.isCommitted;

        const activeClass = isActive ? ' is-active' : '';
        const mutedClass = isMuted ? ' is-muted' : '';
        const buttonsHtml = isActive
          ? `<div class="history-edit-buttons">
               <button class="history-cancel-button" data-action="cancelHistorySelection">Cancel</button>
               <button class="history-edit-button" data-action="openEditWorkoutModal" data-workout-id="${session.id}">Edit</button>
             </div>`
          : '';

        /* Return day/date header (first only) + body part line + workout selector */
        return `${dayDateHeaderHtml}${bodyPartLineHtml}<div class="workout-session-selector${activeClass}${mutedClass}" ${dataAttrs}>
                  <div class="exercise-list-group history-exercise-list">
                    ${exerciseBlocksHtml}
                  </div>
                  ${buttonsHtml}
                </div>`;

      })
      .join("");

    /* All workout blocks (label + selector pairs) combined */
    dayContentHtml = workoutBlocksHtml;
  } else {
    /* Show placeholder for empty days - day/date header + body part line + muted selector */
    const dayDateHeaderHtml = `<div class="history-day-date-header">
      <span class="history-day-date-text">${day.dayName}</span>
      <span class="history-day-date-date data-highlight text-plan">${day.dateString}</span>
    </div>`;

    const placeholderText = isDateInFuture(day.date)
      ? "Remaining Workout Day"
      : "No Workouts Logged";

    const bodyPartLineHtml = `<div class="history-body-part-line">
      <span class="history-body-part-text"></span>
      <span class="history-completion-text"></span>
    </div>`;

    dayContentHtml = `
        ${dayDateHeaderHtml}
        ${bodyPartLineHtml}
        <div class="workout-session-selector is-muted">
          <p class="day-card-placeholder-text history-placeholder-text">${placeholderText}</p>
        </div>
    `;
  }

  /* Sandwich divider between days */
  const separator =
    index < daysOfWeek.length - 1
      ? '<div class="modal-divider history-divider"></div>'
      : "";

  return `<div class="day-section history-day-section">${dayContentHtml}</div>${separator}`;
}
