/* ==========================================================================
   WORKOUT LOG PRESERVATION SERVICE - Session Change Updates

   Preserves logged sets when switching between session types (Express, Maintenance,
   Recommended). Merges existing completed/skipped sets with new workout structure.

   🔒 CEMENT: Logged set preservation logic
   - Keeps all completed/skipped sets that still exist in new session type
   - Adds new pending sets from new session type structure
   - Renumbers all sets to ensure consistency
   - Handles normal, superset, and partner modes separately

   Dependencies: appState, timeOptions, workoutLogGenerationService
   Used by: config-card (time selector change with logged sets)
   ========================================================================== */

import { appState } from "state";
import { timeOptions } from "config";
import {
  generateWorkoutLog,
  generateSupersetWorkoutLog,
  generatePartnerWorkoutLog,
} from "./workoutLogGenerationService.js";

function _renumberSetsInLog(log) {
  const setCounter = {};
  log.forEach((item) => {
    const exName = item.exercise.exercise_name;
    setCounter[exName] = (setCounter[exName] || 0) + 1;
    item.setNumber = setCounter[exName];
  });
  return log;
}

function _mergeExistingWithNew(existingLog, newLog) {
  const mergedLog = [];

  existingLog.forEach((oldEntry) => {
    if (oldEntry.status !== "pending") {
      const matchInNewLog = newLog.find(
        (newEntry) =>
          newEntry.exercise.exercise_name === oldEntry.exercise.exercise_name &&
          newEntry.setNumber === oldEntry.setNumber
      );

      if (matchInNewLog) {
        mergedLog.push(oldEntry);
      }
    }
  });

  newLog.forEach((newEntry) => {
    const alreadyMerged = mergedLog.find(
      (merged) =>
        merged.exercise.exercise_name === newEntry.exercise.exercise_name &&
        merged.setNumber === newEntry.setNumber
    );

    if (!alreadyMerged) {
      mergedLog.push(newEntry);
    }
  });

  return _renumberSetsInLog(mergedLog);
}

export function updateWorkoutLogForSessionChange(existingLog) {
  if (!existingLog || existingLog.length === 0) {
    return generateWorkoutLog();
  }

  const sessionType = timeOptions.find(
    (t) => t.name === appState.session.currentTimeOptionName
  )?.type;

  const newLog = generateWorkoutLog(true, sessionType);
  const mergedLog = [];

  existingLog.forEach((oldEntry) => {
    if (oldEntry.status !== "pending") {
      const matchInNewLog = newLog.find(
        (newEntry) =>
          newEntry.exercise.exercise_name === oldEntry.exercise.exercise_name &&
          newEntry.setNumber === oldEntry.setNumber
      );

      if (matchInNewLog) {
        mergedLog.push(oldEntry);
      }
    }
  });

  newLog.forEach((newEntry) => {
    const alreadyMerged = mergedLog.find(
      (merged) =>
        merged.exercise.exercise_name === newEntry.exercise.exercise_name &&
        merged.setNumber === newEntry.setNumber
    );

    if (!alreadyMerged) {
      mergedLog.push(newEntry);
    }
  });

  return _renumberSetsInLog(mergedLog);
}

export function updateSupersetWorkoutLogForSessionChange(existingLog) {
  if (!existingLog || existingLog.length === 0) {
    return generateSupersetWorkoutLog();
  }

  const sessionType = timeOptions.find(
    (t) => t.name === appState.session.currentTimeOptionName
  )?.type;

  let log1 = generateWorkoutLog(true, sessionType, appState.superset.day1);
  let log2 = generateWorkoutLog(true, sessionType, appState.superset.day2);

  log1.forEach((log) => (log.supersetSide = "left"));
  log2.forEach((log) => (log.supersetSide = "right"));

  const mergedLog1 = _mergeExistingWithNew(
    existingLog.filter(e => e.supersetSide === "left"),
    log1
  );
  const mergedLog2 = _mergeExistingWithNew(
    existingLog.filter(e => e.supersetSide === "right"),
    log2
  );

  const finalLog = [];
  const maxLength = Math.max(mergedLog1.length, mergedLog2.length);
  for (let i = 0; i < maxLength; i++) {
    if (mergedLog1[i]) finalLog.push(mergedLog1[i]);
    if (mergedLog2[i]) finalLog.push(mergedLog2[i]);
  }

  return finalLog;
}

export function updatePartnerWorkoutLogForSessionChange(existingLog) {
  if (!existingLog || existingLog.length === 0) {
    return generatePartnerWorkoutLog();
  }

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

  const mergedLog1 = _mergeExistingWithNew(
    existingLog.filter(e => e.supersetSide === "left"),
    log1
  );
  const mergedLog2 = _mergeExistingWithNew(
    existingLog.filter(e => e.supersetSide === "right"),
    log2
  );

  const finalLog = [];
  const maxLength = Math.max(mergedLog1.length, mergedLog2.length);
  for (let i = 0; i < maxLength; i++) {
    if (mergedLog1[i]) finalLog.push(mergedLog1[i]);
    if (mergedLog2[i]) finalLog.push(mergedLog2[i]);
  }

  return finalLog;
}
