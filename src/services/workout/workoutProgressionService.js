/* ==========================================================================
   WORKOUT PROGRESSION SERVICE - Dual-Mode Exercise Advancement

   Manages current exercise tracking, dual-mode alternating pattern, and exercise
   progression logic. Handles unbalanced superset/partner workout completion.

   🔒 CEMENT: Dual-mode alternating pattern prevents more than 1 exercise ahead
   - Tracks completed sets per side (left/right)
   - Forces alternation when both sides have pending exercises
   - Allows consecutive completion when one side is done

   Dependencies: appState, programConfig, youtubeService, scrollToElement
   Used by: timerService, active-exercise-card, workout-log
   ========================================================================== */

import { appState } from "state";
import { programConfig, colorCodeMap } from "config";
import * as youtubeService from "services/integrations/youtubeService.js";
import { scrollToElement } from "utils";
import { updateActiveCardMessage, updateWorkoutCompletionState } from "./workoutStateService.js";

/* === EXERCISE RESET FOR MUSCLE GROUP === */
export function resetExerciseForMuscleGroup(muscleGroup, day, supersetSide = null) {
  const currentPlan = programConfig[appState.session.currentWorkoutName];
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

  /* 🔒 CEMENT: In dual mode, find exercise matching both muscle group AND side */
  /* Prevents cross-contamination between left/right side exercises */
  const currentExerciseInLog = appState.session.workoutLog.find(
    (log) => {
      const muscleGroupMatches = log.exercise.muscle_group === muscleGroup;
      if (appState.superset.isActive || appState.partner.isActive) {
        return muscleGroupMatches && log.supersetSide === supersetSide;
      }
      return muscleGroupMatches;
    }
  );

  if (!currentExerciseInLog) return;
  const oldExerciseName = currentExerciseInLog.exercise.exercise_name;

  /* 🔒 CEMENT: Only update exercises on the same side in dual mode */
  /* Prevents replacing exercises on both sides when clearing one side */
  appState.session.workoutLog.forEach((log) => {
    const nameMatches = log.exercise.exercise_name === oldExerciseName;

    if (appState.superset.isActive || appState.partner.isActive) {
      if (nameMatches && log.supersetSide === supersetSide) {
        log.exercise = finalExerciseData;
      }
    } else {
      if (nameMatches) {
        log.exercise = finalExerciseData;
      }
    }
  });
}

/* === DUAL-MODE EXERCISE PROGRESSION === */
function findNextDualModeExercise() {
  const workoutLog = appState.session.workoutLog;

  const pendingLeft = workoutLog.filter(log =>
    log.status === "pending" && log.supersetSide === "left"
  );
  const pendingRight = workoutLog.filter(log =>
    log.status === "pending" && log.supersetSide === "right"
  );

  /* If one side is complete, allow consecutive exercises on the other side */
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

  /* If both sides have pending exercises, follow alternating pattern */
  if (pendingLeft.length > 0 && pendingRight.length > 0) {
    const completedLeft = workoutLog.filter(log =>
      log.supersetSide === "left" && log.status !== "pending"
    ).length;
    const completedRight = workoutLog.filter(log =>
      log.supersetSide === "right" && log.status !== "pending"
    ).length;

    /* Prevent getting more than 1 exercise ahead on either side */
    const leftAhead = completedLeft - completedRight;
    const rightAhead = completedRight - completedLeft;

    if (leftAhead >= 1) {
      return workoutLog.findIndex(log =>
        log.status === "pending" && log.supersetSide === "right"
      );
    } else if (rightAhead >= 1) {
      return workoutLog.findIndex(log =>
        log.status === "pending" && log.supersetSide === "left"
      );
    }
  }

  return workoutLog.findIndex(log => log.status === "pending");
}

export function canLogDualModeSide(side) {
  const workoutLog = appState.session.workoutLog;

  const pendingLeft = workoutLog.filter(log =>
    log.status === "pending" && log.supersetSide === "left"
  );
  const pendingRight = workoutLog.filter(log =>
    log.status === "pending" && log.supersetSide === "right"
  );

  const pendingThisSide = side === "left" ? pendingLeft : pendingRight;
  if (pendingThisSide.length === 0) return false;

  const otherSide = side === "left" ? "right" : "left";
  const pendingOtherSide = otherSide === "left" ? pendingLeft : pendingRight;
  if (pendingOtherSide.length === 0) return true;

  const completedLeft = workoutLog.filter(log =>
    log.supersetSide === "left" && log.status !== "pending"
  ).length;
  const completedRight = workoutLog.filter(log =>
    log.supersetSide === "right" && log.status !== "pending"
  ).length;

  if (side === "left") {
    return completedLeft <= completedRight;
  } else {
    return completedRight <= completedLeft;
  }
}

export function recalculateCurrentStateAfterLogChange(options = {}) {
  const oldIndex = appState.session.currentLogIndex;

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
        programConfig[appState.session.currentWorkoutName];
      appState.session.currentExerciseColorClass =
        colorCodeMap[logEntry.exercise[currentPlan.colorKey]] || "text-plan";
    }
  }

  updateActiveCardMessage();
}

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
  const currentPlan = programConfig[appState.session.currentWorkoutName];
  appState.session.currentExerciseColorClass =
    colorCodeMap[newLog.exercise[currentPlan.colorKey]] || "text-plan";
}
