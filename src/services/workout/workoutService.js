/* ==========================================================================
   WORKOUT SERVICE - Exercise Retrieval & Weekly Plan

   Manages exercise retrieval, weekly plan building, and workout time calculations.
   Core building blocks for workout log generation.

   Dependencies: appState, programConfig, workoutMetricsService, timerLedgerService
   Used by: workoutFactoryService, appInitializerService, config-card
   ========================================================================== */

import { appState } from "state";
import { programConfig, muscleGroupSortOrder } from "config";
import * as workoutMetricsService from "./workoutMetricsService.js";
import * as timerLedgerService from "./timerLedgerService.js";

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
