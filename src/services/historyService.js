import { appState } from "state";
import { formatTimestamp } from "utils";
import * as persistenceService from "services/persistenceService.js";
import { programConfig } from "config";

function getSessionHeaderInfo() {
  const { session, weeklyPlan, allExercises } = appState;
  const currentPlan = programConfig[session.currentWorkoutPlanName];

  if (!currentPlan) {
    console.error(
      "Configuration for plan not found:",
      session.currentWorkoutPlanName
    );
    return null;
  }

  const firstLog =
    session.workoutLog.find(
      (log) => log.status === "completed" || log.status === "skipped"
    ) || session.workoutLog[0];
  if (!firstLog) return null;

  let headerInfo = {
    planName: session.currentWorkoutPlanName, // CEMENTED FIX (Issue 2): Persist the plan name.
    sessionTypeName: session.currentTimeOptionName,
    sessionColorClass: session.currentSessionColorClass,
  };

  if (appState.superset.isActive) {
    const day1Info = weeklyPlan[appState.superset.day1];
    const day2Info = weeklyPlan[appState.superset.day2];
    headerInfo.bodyPart = `${day1Info.title} & ${day2Info.title}`;
    headerInfo.bodyPartColorKey = "cc1";
    headerInfo.bodyPart2ColorKey = "cc3";
  } else if (appState.partner.isActive) {
    const dayName = firstLog.exercise.day;
    const dayInfo = weeklyPlan[dayName] || { title: "N/A", type: "N/A" };
    const exerciseForColor = allExercises.find((ex) => ex.day === dayName);
    headerInfo.dayName = dayName;
    headerInfo.bodyPart = `${dayInfo.title} (Partner)`;
    headerInfo.bodyPartColorKey = exerciseForColor
      ? exerciseForColor[currentPlan.colorKey]
      : "cc1";
    headerInfo.type = dayInfo.type;
  } else {
    const dayName = firstLog.exercise.day;
    const dayInfo = weeklyPlan[dayName] || { title: "N/A", type: "N/A" };
    const exerciseForColor = allExercises.find((ex) => ex.day === dayName);
    headerInfo.dayName = dayName;
    headerInfo.bodyPart = dayInfo.title;
    headerInfo.bodyPartColorKey = exerciseForColor
      ? exerciseForColor[currentPlan.colorKey]
      : "cc1";
    headerInfo.type = dayInfo.type;
  }

  return headerInfo;
}

export function addOrUpdateLog(logEntry) {
  if (appState.partner.isActive && logEntry.supersetSide === "right") {
    return;
  }

  const { user, session } = appState;
  const history = user.history.workouts;
  let workout = history.find((w) => w.id === session.id);

  if (!workout) {
    const headerInfo = getSessionHeaderInfo();
    if (!headerInfo) return;

    workout = {
      id: session.id,
      timestamp: formatTimestamp(new Date()),
      ...headerInfo,
      logs: [],
    };
    history.unshift(workout);
  }

  Object.assign(workout, getSessionHeaderInfo());

  const existingLogIndex = workout.logs.findIndex(
    (l) =>
      l.exercise.exercise_name === logEntry.exercise.exercise_name &&
      l.setNumber === logEntry.setNumber &&
      l.supersetSide === logEntry.supersetSide
  );

  const logCopy = JSON.parse(JSON.stringify(logEntry));

  if (existingLogIndex > -1) {
    workout.logs[existingLogIndex] = logCopy;
  } else {
    workout.logs.push(logCopy);
  }

  persistenceService.saveState();
}

export function removeLog(logEntry) {
  const { user, session } = appState;
  let history = user.history.workouts;
  const workoutIndex = history.findIndex((w) => w.id === session.id);

  if (workoutIndex > -1) {
    history[workoutIndex].logs = history[workoutIndex].logs.filter(
      (l) =>
        !(
          l.exercise.exercise_name === logEntry.exercise.exercise_name &&
          l.setNumber === logEntry.setNumber &&
          l.supersetSide === logEntry.supersetSide
        )
    );

    if (history[workoutIndex].logs.length === 0) {
      history.splice(workoutIndex, 1);
    }

    persistenceService.saveState();
  }
}
