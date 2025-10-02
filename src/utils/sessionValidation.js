import { appState } from "state";
import { timeOptions, expressSetRules, maintenanceSetRules } from "config";

// 🔒 CEMENT: Shared session cycling validation logic
// Prevents cycling to sessions that would remove logged exercise sets
export function canCycleToSession(targetSessionName) {
  const targetOption = timeOptions.find((t) => t.name === targetSessionName);
  if (!targetOption) return false;

  const targetType = targetOption.type;

  // Can always cycle back to Recommended (adds sets, doesn't remove)
  if (targetType === "Recommended") return true;

  const currentLog = appState.session.workoutLog;
  if (!currentLog || currentLog.length === 0) return true;

  const targetDay = appState.session.currentDayName;

  if (targetType === "Express") {
    const dayRules = expressSetRules[targetDay];

    // 🔒 CEMENT: Express validation must simulate the actual filtering that happens in generateWorkoutLog
    // The current log has been renumbered, so we can't directly compare set numbers to rules
    // Instead, we need to check: would Express filtering remove any logged sets from the current log?

    if (dayRules) {
      // For days with rules: Check if any logged sets would be removed
      // We can't match by set number (current log is renumbered), so we match by exercise name
      // and check if the logged set count would decrease

      const loggedByExercise = {};
      currentLog.forEach((log) => {
        if (log.status !== "pending") {
          const name = log.exercise.exercise_name;
          loggedByExercise[name] = (loggedByExercise[name] || 0) + 1;
        }
      });

      // Check if any exercises in removal rules have logged sets
      for (const rule of dayRules) {
        if (loggedByExercise[rule.name] > 0) {
          // This exercise has logged sets and would have a set removed by Express
          // Block Express cycling
          return false;
        }
      }
      return true;
    } else {
      // No rules: Express removes last set
      // Check if last set is logged
      const lastSet = currentLog[currentLog.length - 1];
      return lastSet.status === "pending";
    }
  }

  if (targetType === "Maintenance") {
    // 🔒 CEMENT: Maintenance keeps only first 2 sets of each Major1/Minor1 exercise
    // Block if ANY sets beyond the first 2 per exercise are logged

    const exerciseSetCounts = {};

    // Group by exercise name and count logged sets per exercise
    currentLog.forEach((log) => {
      const exName = log.exercise.exercise_name;
      const muscleGroup = log.exercise.muscle_group;

      if (muscleGroup === "Major1" || muscleGroup === "Minor1") {
        if (!exerciseSetCounts[exName]) {
          exerciseSetCounts[exName] = { total: 0, logged: 0, muscleGroup };
        }
        exerciseSetCounts[exName].total++;
        if (log.status !== "pending") {
          exerciseSetCounts[exName].logged++;
        }
      }
    });

    // Check each Major1/Minor1 exercise
    for (const exName in exerciseSetCounts) {
      const { total, logged, muscleGroup } = exerciseSetCounts[exName];

      // If this exercise has more than 2 sets total, and ANY are logged beyond first 2
      if (total > 2 && logged > 0) {
        // Get the first 2 sets for this exercise
        const exerciseSets = currentLog.filter(
          (log) => log.exercise.exercise_name === exName
        );
        const beyond2Sets = exerciseSets.slice(2);

        // If any sets beyond the first 2 are logged, block Maintenance
        const hasLoggedBeyond2 = beyond2Sets.some((log) => log.status !== "pending");
        if (hasLoggedBeyond2) {
          return false;
        }
      }
    }

    // Check if any non-Major1/Minor1 sets would be removed that are logged
    const dayRules = maintenanceSetRules[targetDay];
    const otherSets = currentLog.filter(
      (log) => log.exercise.muscle_group !== "Major1" && log.exercise.muscle_group !== "Minor1"
    );

    for (const log of otherSets) {
      const isInAddRules =
        dayRules &&
        dayRules.add &&
        dayRules.add.some(
          (rule) => rule.name === log.exercise.exercise_name && rule.set === log.setNumber
        );
      if (!isInAddRules && log.status !== "pending") {
        return false;
      }
    }
  }

  return true;
}
