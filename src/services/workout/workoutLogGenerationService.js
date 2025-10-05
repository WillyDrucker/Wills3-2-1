/* ==========================================================================
   WORKOUT LOG GENERATION SERVICE - New Workout Creation

   Generates fresh workout logs for normal, superset, and partner modes. Applies
   session type rules (Express, Maintenance, Recommended) to determine which sets
   to include.

   🔒 CEMENT: Session type filtering logic
   - Express: Removes specific sets per day based on expressSetRules
   - Maintenance: Takes first 2 sets of Major1 and Minor1, plus day-specific adds
   - Recommended: Includes all sets from exercise data

   Dependencies: appState, programConfig, youtubeService, workoutService
   Used by: config-card (day/plan/time changes), workoutLogPreservationService
   ========================================================================== */

import { appState } from "state";
import {
  programConfig,
  expressSetRules,
  maintenanceSetRules,
  timeOptions,
} from "config";
import * as youtubeService from "services/integrations/youtubeService.js";
import { getActiveWorkout } from "./workoutService.js";

function _renumberSetsInLog(log) {
  const setCounter = {};
  log.forEach((item) => {
    const exName = item.exercise.exercise_name;
    setCounter[exName] = (setCounter[exName] || 0) + 1;
    item.setNumber = setCounter[exName];
  });
  return log;
}

export function generateWorkoutLog(
  isPreview = false,
  sessionType = null,
  day = null
) {
  if (!isPreview) {
    appState.session.id = Date.now();
  }

  const targetDay = day || appState.session.currentDayName;
  const activeWorkout = getActiveWorkout(targetDay);
  if (activeWorkout.length === 0) return [];

  const currentSessionType =
    sessionType ||
    timeOptions.find((t) => t.name === appState.session.currentTimeOptionName)
      ?.type ||
    "Recommended";

  let fullLog = [];
  activeWorkout.forEach((exercise) => {
    const exerciseDataWithLink = youtubeService.getExerciseWithLink(exercise);
    const sets = parseInt(exercise.sets, 10) || 0;
    for (let i = 1; i <= sets; i++) {
      fullLog.push({
        exercise: exerciseDataWithLink,
        setNumber: i,
        status: "pending",
        weight: 0,
        reps: 10,
        timestamp: "",
        restCompleted: false,
        restWasSkipped: false,
        skippedRestValue: null,
        supersetSide: null,
        isAnimating: false,
        isSkipAnimating: false,
        skipAnimationPlayed: false,
        skipAnimationCycleId: null,
        userName: null,
        userColorClass: null,
      });
    }
  });

  let finalLog = fullLog;
  if (currentSessionType === "Express") {
    const dayRules = expressSetRules[targetDay];
    if (dayRules) {
      finalLog = fullLog.filter(
        (log) =>
          !dayRules.some(
            (rule) =>
              rule.name === log.exercise.exercise_name &&
              rule.set === log.setNumber
          )
      );
    } else {
      finalLog = fullLog.slice(0, -1);
    }
  } else if (currentSessionType === "Maintenance") {
    let major1Sets = fullLog
      .filter((log) => log.exercise.muscle_group === "Major1")
      .slice(0, 2);
    let minor1Sets = fullLog
      .filter((log) => log.exercise.muscle_group === "Minor1")
      .slice(0, 2);
    finalLog = [...major1Sets, ...minor1Sets];
    const dayRules = maintenanceSetRules[targetDay];
    if (dayRules && dayRules.add) {
      dayRules.add.forEach((ruleToAdd) => {
        const setToAdd = fullLog.find(
          (log) =>
            log.exercise.exercise_name === ruleToAdd.name &&
            log.setNumber === ruleToAdd.set
        );
        if (setToAdd) finalLog.push(setToAdd);
      });
    }
  }

  return _renumberSetsInLog(finalLog);
}

export function generateSupersetWorkoutLog() {
  const sessionType = timeOptions.find(
    (t) => t.name === appState.session.currentTimeOptionName
  )?.type;
  let log1 = generateWorkoutLog(true, sessionType, appState.superset.day1);
  let log2 = generateWorkoutLog(true, sessionType, appState.superset.day2);

  log1.forEach((log) => (log.supersetSide = "left"));
  log2.forEach((log) => (log.supersetSide = "right"));

  const finalLog = [];
  const maxLength = Math.max(log1.length, log2.length);
  for (let i = 0; i < maxLength; i++) {
    if (log1[i]) finalLog.push(log1[i]);
    if (log2[i]) finalLog.push(log2[i]);
  }
  return finalLog;
}

export function generatePartnerWorkoutLog() {
  const { partner, session } = appState;
  const sessionType = timeOptions.find(
    (t) => t.name === session.currentTimeOptionName
  )?.type;

  let log1 = generateWorkoutLog(true, sessionType, partner.user1Day);
  let log2 = generateWorkoutLog(true, sessionType, partner.user2Day);

  log1.forEach((log) => {
    log.supersetSide = "left";
    log.userName = partner.user1Name;
    log.userColorClass = "text-plan";
  });
  log2.forEach((log) => {
    log.supersetSide = "right";
    log.userName = partner.user2Name;
    log.userColorClass = "text-primary";
  });

  const finalLog = [];
  const maxLength = Math.max(log1.length, log2.length);
  for (let i = 0; i < maxLength; i++) {
    if (log1[i]) finalLog.push(log1[i]);
    if (log2[i]) finalLog.push(log2[i]);
  }
  return finalLog;
}
