import { appState } from "state";
import {
  programConfig,
  expressSetRules,
  maintenanceSetRules,
  timeOptions,
} from "config";
import * as youtubeService from "services/youtubeService.js";
import { getActiveWorkout } from "services/workoutService.js";

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

// 🔒 CEMENT: Preserve logged sets when updating workout session type
export function updateWorkoutLogForSessionChange(existingLog) {
  if (!existingLog || existingLog.length === 0) {
    return generateWorkoutLog();
  }

  // Generate new log with current session type
  const sessionType = timeOptions.find(
    (t) => t.name === appState.session.currentTimeOptionName
  )?.type;

  const newLog = generateWorkoutLog(true, sessionType);

  // Merge: Keep logged/skipped sets from existing log, add any new pending sets
  const mergedLog = [];

  // First, add all logged/skipped sets from existing log that still exist in new log
  existingLog.forEach((oldEntry) => {
    if (oldEntry.status !== "pending") {
      // Check if this exercise/set combination exists in the new log
      const matchInNewLog = newLog.find(
        (newEntry) =>
          newEntry.exercise.exercise_name === oldEntry.exercise.exercise_name &&
          newEntry.setNumber === oldEntry.setNumber
      );

      if (matchInNewLog) {
        // Keep the old logged entry with its data
        mergedLog.push(oldEntry);
      }
    }
  });

  // Then add all pending sets from new log that aren't already in merged log
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

// 🔒 CEMENT: Preserve logged sets when updating superset session type
export function updateSupersetWorkoutLogForSessionChange(existingLog) {
  if (!existingLog || existingLog.length === 0) {
    return generateSupersetWorkoutLog();
  }

  // Generate new superset log with current session type
  const sessionType = timeOptions.find(
    (t) => t.name === appState.session.currentTimeOptionName
  )?.type;

  let log1 = generateWorkoutLog(true, sessionType, appState.superset.day1);
  let log2 = generateWorkoutLog(true, sessionType, appState.superset.day2);

  log1.forEach((log) => (log.supersetSide = "left"));
  log2.forEach((log) => (log.supersetSide = "right"));

  // Merge existing logged sets from both sides
  const mergedLog1 = _mergeExistingWithNew(
    existingLog.filter(e => e.supersetSide === "left"),
    log1
  );
  const mergedLog2 = _mergeExistingWithNew(
    existingLog.filter(e => e.supersetSide === "right"),
    log2
  );

  // Interleave the two logs (same pattern as generateSupersetWorkoutLog)
  const finalLog = [];
  const maxLength = Math.max(mergedLog1.length, mergedLog2.length);
  for (let i = 0; i < maxLength; i++) {
    if (mergedLog1[i]) finalLog.push(mergedLog1[i]);
    if (mergedLog2[i]) finalLog.push(mergedLog2[i]);
  }

  return finalLog;
}

// 🔒 CEMENT: Preserve logged sets when updating partner session type
export function updatePartnerWorkoutLogForSessionChange(existingLog) {
  if (!existingLog || existingLog.length === 0) {
    return generatePartnerWorkoutLog();
  }

  // Generate new partner log with current session type
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

  // Merge existing logged sets from both users
  const mergedLog1 = _mergeExistingWithNew(
    existingLog.filter(e => e.supersetSide === "left"),
    log1
  );
  const mergedLog2 = _mergeExistingWithNew(
    existingLog.filter(e => e.supersetSide === "right"),
    log2
  );

  // Interleave the two logs (same pattern as generatePartnerWorkoutLog)
  const finalLog = [];
  const maxLength = Math.max(mergedLog1.length, mergedLog2.length);
  for (let i = 0; i < maxLength; i++) {
    if (mergedLog1[i]) finalLog.push(mergedLog1[i]);
    if (mergedLog2[i]) finalLog.push(mergedLog2[i]);
  }

  return finalLog;
}

// Helper function to merge existing logged sets with new workout structure
function _mergeExistingWithNew(existingLog, newLog) {
  const mergedLog = [];

  // First, add all logged/skipped sets from existing log that still exist in new log
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

  // Then add all pending sets from new log that aren't already in merged log
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
