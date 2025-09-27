/* ==========================================================================
   WORKOUT SERVICE - CORE WORKOUT LOGIC

   Manages workout progression, completion state, and dual-mode exercise alternation.
   Handles current exercise tracking and workout completion detection.

   🔒 CEMENT: Dual-mode alternating pattern prevents more than 1 exercise ahead
   🔒 CEMENT: Unbalanced exercise counts allow consecutive completion when one side done
   🔒 CEMENT: Current exercise header logic maintains user flow clarity

   Architecture: Stateful workout progression with dual-mode awareness
   Component Structure:
   ├── Exercise retrieval and workout building
   ├── Current state recalculation after changes
   ├── Dual-mode completion logic for unbalanced sides
   └── Active card message management

   Dependencies: appState, programConfig, workoutMetrics, timerLedger
   Used by: Timer service, active exercise card, workout progression
   ========================================================================== */

import { appState } from "state";
import { programConfig, colorCodeMap, muscleGroupSortOrder } from "config";
import * as youtubeService from "services/youtubeService.js";
import * as timerLedgerService from "services/timerLedgerService.js";
import * as workoutMetricsService from "services/workoutMetricsService.js";
import { scrollToElement } from "utils";

/* === EXERCISE RETRIEVAL === */
export function getActiveWorkout(dayName) {
  const currentPlan = programConfig[appState.session.currentWorkoutPlanName];
  if (!currentPlan) return [];
  const currentDayInfo = appState.weeklyPlan[dayName];
  if (!currentDayInfo || currentDayInfo.type === "Rest") return [];

  const dailyExercises = appState.allExercises
    .filter((ex) => ex.day === dayName && ex[currentPlan.colorKey] !== "red")
    .sort((a, b) => {
      const sortA = muscleGroupSortOrder[a.muscle_group] || 99;
      const sortB = muscleGroupSortOrder[b.muscle_group] || 99;
      if (sortA !== sortB) return sortA - sortB;
      return (a[currentPlan.orderKey] || "").localeCompare(
        b[currentPlan.orderKey] || ""
      );
    });

  const primaryExercises = [];
  const processedMuscleGroups = new Set();
  for (const exercise of dailyExercises) {
    if (!processedMuscleGroups.has(exercise.muscle_group)) {
      primaryExercises.push(exercise);
      processedMuscleGroups.add(exercise.muscle_group);
    }
  }
  return primaryExercises.sort(
    (a, b) =>
      (muscleGroupSortOrder[a.muscle_group] || 99) -
      (muscleGroupSortOrder[b.muscle_group] || 99)
  );
}

/* === WEEKLY PLAN BUILDING === */
export function buildWeeklyPlan() {
  const plan = {};
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  daysOfWeek.forEach((day) => {
    const exercisesForDay = appState.allExercises.filter(
      (ex) => ex.day === day
    );
    if (exercisesForDay.length > 0) {
      const exerciseWithBodyPart =
        exercisesForDay.find((ex) => ex.body_part) || exercisesForDay[0];
      const exerciseWithPushPull = exercisesForDay.find(
        (ex) => ex.push_pull
      ) || { push_pull: "N/A" };
      plan[day] = {
        title: exerciseWithBodyPart.body_part,
        type: exerciseWithPushPull.push_pull,
      };
    } else {
      plan[day] = { title: "Rest", type: "Rest" };
    }
  });
  appState.weeklyPlan = plan;
}

/* === WORKOUT TIME CALCULATIONS === */
export function updateWorkoutTimeRemaining() {
  const { session, superset, partner, rest } = appState;
  let baselineDuration, bonusMinutes;

  if (superset.isActive) {
    const metrics = workoutMetricsService.calculateSupersetWorkoutMetrics(
      superset.day1,
      superset.day2,
      session.currentTimeOptionName
    );
    baselineDuration = metrics.duration;
    bonusMinutes = superset.bonusMinutes;
  } else if (partner.isActive) {
    const metrics = workoutMetricsService.calculateSupersetWorkoutMetrics(
      partner.user1Day,
      partner.user2Day,
      session.currentTimeOptionName
    );
    baselineDuration = metrics.duration;
    bonusMinutes = 0;
  } else {
    baselineDuration = workoutMetricsService.calculateWorkoutMetrics(
      session.workoutLog
    ).duration;
    bonusMinutes = 0;
  }

  session.workoutTimeRemaining = timerLedgerService.calculateRemainingTime(
    session,
    superset,
    partner,
    rest,
    baselineDuration,
    bonusMinutes
  );
}

export function resetExerciseForMuscleGroup(muscleGroup, day) {
  const currentPlan = programConfig[appState.session.currentWorkoutPlanName];
  const orderKey = currentPlan.orderKey;

  const defaultExercise = appState.allExercises.find(
    (ex) =>
      ex.day === day &&
      ex.muscle_group === muscleGroup &&
      ex[orderKey] &&
      ex[orderKey].endsWith("1")
  );

  if (!defaultExercise) return;
  const finalExerciseData = youtubeService.getExerciseWithLink(defaultExercise);
  const currentExerciseInLog = appState.session.workoutLog.find(
    (log) => log.exercise.muscle_group === muscleGroup
  );
  if (!currentExerciseInLog) return;
  const oldExerciseName = currentExerciseInLog.exercise.exercise_name;

  appState.session.workoutLog.forEach((log) => {
    if (log.exercise.exercise_name === oldExerciseName) {
      log.exercise = finalExerciseData;
    }
  });
}

/* === COMPLETION STATE MANAGEMENT === */
export function updateWorkoutCompletionState() {
  const wasAlreadyComplete = appState.session.isWorkoutComplete;

  const hasPendingSets = appState.session.workoutLog.some(
    (log) => log.status === "pending"
  );
  const areTimersActive =
    appState.rest.normal.type !== "none" ||
    appState.rest.superset.left.type !== "none" ||
    appState.rest.superset.right.type !== "none";

  if (!hasPendingSets && !areTimersActive) {
    if (!wasAlreadyComplete && appState.session.workoutLog.length > 0) {
      appState.session.isWorkoutComplete = true;
      appState.session.playCompletionAnimation = true;
      appState.ui.scrollAfterRender.target = "active-card";
    }
  } else {
    appState.session.isWorkoutComplete = false;
  }
}

/* === DUAL-MODE EXERCISE PROGRESSION === */
function findNextDualModeExercise() {
  const workoutLog = appState.session.workoutLog;
  const currentIndex = appState.session.currentLogIndex;

  // Get pending exercises for each side
  const pendingLeft = workoutLog.filter(log =>
    log.status === "pending" && log.supersetSide === "left"
  );
  const pendingRight = workoutLog.filter(log =>
    log.status === "pending" && log.supersetSide === "right"
  );

  // If one side is complete, allow consecutive exercises on the other side
  if (pendingLeft.length === 0 && pendingRight.length > 0) {
    return workoutLog.findIndex(log =>
      log.status === "pending" && log.supersetSide === "right"
    );
  }

  if (pendingRight.length === 0 && pendingLeft.length > 0) {
    return workoutLog.findIndex(log =>
      log.status === "pending" && log.supersetSide === "left"
    );
  }

  // If both sides have pending exercises, follow alternating pattern
  if (pendingLeft.length > 0 && pendingRight.length > 0) {
    const currentLog = workoutLog[currentIndex];
    const completedLeft = workoutLog.filter(log =>
      log.supersetSide === "left" && log.status !== "pending"
    ).length;
    const completedRight = workoutLog.filter(log =>
      log.supersetSide === "right" && log.status !== "pending"
    ).length;

    // Prevent getting more than 1 exercise ahead on either side
    const leftAhead = completedLeft - completedRight;
    const rightAhead = completedRight - completedLeft;

    if (leftAhead >= 1) {
      // Left is ahead, force right next
      return workoutLog.findIndex(log =>
        log.status === "pending" && log.supersetSide === "right"
      );
    } else if (rightAhead >= 1) {
      // Right is ahead, force left next
      return workoutLog.findIndex(log =>
        log.status === "pending" && log.supersetSide === "left"
      );
    }
  }

  // Default to first pending exercise
  return workoutLog.findIndex(log => log.status === "pending");
}

export function canLogDualModeSide(side) {
  const workoutLog = appState.session.workoutLog;

  // Get pending exercises for each side
  const pendingLeft = workoutLog.filter(log =>
    log.status === "pending" && log.supersetSide === "left"
  );
  const pendingRight = workoutLog.filter(log =>
    log.status === "pending" && log.supersetSide === "right"
  );

  // If this side has no pending exercises, can't log
  const pendingThisSide = side === "left" ? pendingLeft : pendingRight;
  if (pendingThisSide.length === 0) return false;

  // If other side is complete, always allow this side
  const otherSide = side === "left" ? "right" : "left";
  const pendingOtherSide = otherSide === "left" ? pendingLeft : pendingRight;
  if (pendingOtherSide.length === 0) return true;

  // If both sides have pending exercises, check alternating pattern
  const completedLeft = workoutLog.filter(log =>
    log.supersetSide === "left" && log.status !== "pending"
  ).length;
  const completedRight = workoutLog.filter(log =>
    log.supersetSide === "right" && log.status !== "pending"
  ).length;

  // Allow if this side is behind or equal
  if (side === "left") {
    return completedLeft <= completedRight;
  } else {
    return completedRight <= completedLeft;
  }
}

export function recalculateCurrentStateAfterLogChange(options = {}) {
  const oldIndex = appState.session.currentLogIndex;

  // For dual-mode workouts, find next exercise considering unbalanced sides
  let newCurrentIndex;
  if (appState.superset.isActive || appState.partner.isActive) {
    newCurrentIndex = findNextDualModeExercise();
  } else {
    newCurrentIndex = appState.session.workoutLog.findIndex(
      (log) => log.status === "pending"
    );
  }

  if (newCurrentIndex === -1 && appState.session.workoutLog.length > 0) {
    updateWorkoutCompletionState();
    if (appState.session.isWorkoutComplete) {
      appState.session.currentLogIndex = appState.session.workoutLog.length;
    } else {
      appState.session.currentLogIndex = newCurrentIndex;
    }
  } else {
    appState.session.isWorkoutComplete = false;
    appState.session.currentLogIndex = newCurrentIndex;
  }

  if (
    options.shouldScroll &&
    oldIndex !== appState.session.currentLogIndex &&
    !appState.session.isWorkoutComplete &&
    appState.session.workoutLog.length > 0
  ) {
    const targetSelector = `.workout-log-item-container[data-log-index="${appState.session.currentLogIndex}"]`;
    scrollToElement(targetSelector, { block: "nearest" });
  }

  const logEntry =
    appState.session.workoutLog[appState.session.currentLogIndex];
  if (logEntry) {
    if (appState.partner.isActive) {
      appState.session.currentExerciseColorClass = logEntry.userColorClass;
    } else {
      const currentPlan =
        programConfig[appState.session.currentWorkoutPlanName];
      appState.session.currentExerciseColorClass =
        colorCodeMap[logEntry.exercise[currentPlan.colorKey]] || "text-plan";
    }
  }

  updateActiveCardMessage();
}

/*
  CEMENTED (v5.0.2)
  This function is the definitive logic for the "Begin Exercise..." prompt.
  It is the single source of truth for this state change.
  - It handles the initial state ("Begin Exercise").
  - It differentiates between a new set of the same exercise ("Begin Next Set").
  - It detects a change in exercise/muscle group ("Begin Next Exercise").
  - It handles the final set ("Last Exercise!").
*/
export function updateActiveCardMessage() {
  const { session } = appState;
  const { workoutLog, currentLogIndex } = session;

  if (session.isWorkoutComplete || workoutLog.length === 0) return;

  const currentLog = workoutLog[currentLogIndex];
  if (!currentLog) return;

  const pendingSets = workoutLog.filter((log) => log.status === "pending");
  if (pendingSets.length === 1) {
    session.activeCardMessage = "Last Exercise!";
    return;
  }

  if (currentLogIndex === 0) {
    session.activeCardMessage = "Begin Exercise - Log Results";
    return;
  }

  const hasPreviousSets = workoutLog.some(
    (log) =>
      (log.status === "completed" || log.status === "skipped") &&
      log.exercise.muscle_group === currentLog.exercise.muscle_group &&
      log.supersetSide === currentLog.supersetSide
  );

  if (hasPreviousSets) {
    session.activeCardMessage = "Begin Next Set";
  } else {
    session.activeCardMessage = "Begin Next Exercise";
  }
}

/**
 * CEMENTED REFACTOR (v5.1.0)
 * This function was moved from timerService.js to consolidate workout progression logic.
 * It is now the single source of truth for advancing the workout state when a rest period begins.
 */
export function advanceToNextExercise() {
  let nextIndex = appState.session.workoutLog.findIndex(
    (log) => log.status === "pending"
  );
  appState.session.currentLogIndex =
    nextIndex !== -1 ? nextIndex : appState.session.workoutLog.length;

  if (appState.session.currentLogIndex >= appState.session.workoutLog.length) {
    return;
  }

  const newLog = appState.session.workoutLog[appState.session.currentLogIndex];

  const applyCarryOver = (lastLogged, currentLog) => {
    if (lastLogged.index === null) return;

    const previousLog = appState.session.workoutLog[lastLogged.index];
    if (
      previousLog &&
      currentLog.exercise.muscle_group === previousLog.exercise.muscle_group
    ) {
      currentLog.weight = lastLogged.weight;
      currentLog.reps = lastLogged.reps;
    } else {
      currentLog.weight = 0;
      currentLog.reps = 10;
    }
  };

  if (appState.superset.isActive || appState.partner.isActive) {
    const side = newLog.supersetSide;
    if (!side) return;
    const targetLastLogged =
      side === "left"
        ? appState.session.lastLoggedSet.supersetLeft
        : appState.session.lastLoggedSet.supersetRight;
    applyCarryOver(targetLastLogged, newLog);
  } else {
    applyCarryOver(appState.session.lastLoggedSet.normal, newLog);
  }

  updateActiveCardMessage();
  const currentPlan = programConfig[appState.session.currentWorkoutPlanName];
  appState.session.currentExerciseColorClass =
    colorCodeMap[newLog.exercise[currentPlan.colorKey]] || "text-plan";
}
