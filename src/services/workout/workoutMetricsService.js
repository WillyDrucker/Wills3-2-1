import { timeOptions } from "config";
import { generateWorkoutLog } from "services/workout/workoutLogGenerationService.js";

/**
 * CEMENTED
 * A pure function for calculating the core metrics (total sets, duration,
 * sets per exercise) for a standard workout log. It is the single source of
 * truth for these calculations.
 */
export function calculateWorkoutMetrics(log) {
  if (!log || log.length === 0)
    return { totalSets: 0, duration: 0, setsInWorkout: {} };
  const totalSets = log.filter((l) => l.status !== "skipped").length;
  const duration = Math.max(0, log.length * 6 - 5);
  const setsInWorkout = log.reduce((acc, currentLog) => {
    const exerciseName = currentLog.exercise.exercise_name;
    acc[exerciseName] = (acc[exerciseName] || 0) + 1;
    return acc;
  }, {});
  return { totalSets, duration, setsInWorkout };
}

/**
 * CEMENTED
 * A pure function for calculating sets per exercise in Superset or Partner mode,
 * where the combination of exercise name and side ('left'/'right') defines a
 * unique exercise instance.
 */
export function calculateDualModeSetsInWorkout(log) {
  return log.reduce((acc, currentLog) => {
    const uniqueExerciseKey =
      currentLog.exercise.exercise_name + (currentLog.supersetSide || "");
    acc[uniqueExerciseKey] = (acc[uniqueExerciseKey] || 0) + 1;
    return acc;
  }, {});
}

/**
 * CEMENTED
 * A pure function for calculating Superset/Partner mode duration and bonus minutes.
 * This complex logic is now isolated and stable.
 */
export function calculateSupersetWorkoutMetrics(
  day1Name,
  day2Name,
  sessionTypeName
) {
  const sessionType = timeOptions.find(
    (opt) => opt.name === sessionTypeName
  )?.type;
  if (!sessionType) return { duration: 0, bonusMinutes: 0 };
  const tempLog1 = generateWorkoutLog(true, sessionType, day1Name);
  const tempLog2 = generateWorkoutLog(true, sessionType, day2Name);
  let baselineDuration;
  let bonusMinutes = 0;

  if (tempLog1.length > tempLog2.length) {
    baselineDuration = calculateWorkoutMetrics(tempLog1).duration;
  } else if (tempLog2.length > tempLog1.length) {
    baselineDuration = calculateWorkoutMetrics(tempLog2).duration;
  } else {
    baselineDuration = calculateWorkoutMetrics(tempLog2).duration;
    if (sessionType === "Recommended") bonusMinutes = 3;
    else if (sessionType === "Express") bonusMinutes = 2;
    else if (sessionType === "Maintenance") bonusMinutes = 1;
  }
  return { duration: baselineDuration, bonusMinutes: bonusMinutes };
}
