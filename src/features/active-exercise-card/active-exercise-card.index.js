import { appState } from "state";
import { ui } from "ui";
import { getActiveExerciseCardTemplate } from "./active-exercise-card.template.js";
import { formatTimestamp, calculateCompletionTime, pluralize } from "utils";
import {
  startNormalRestTimer,
  startSupersetRestTimer,
  handleNormalRestCompletion,
  handleSupersetRestCompletion,
} from "services/timerService.js";
import * as workoutService from "services/workoutService.js";
import * as youtubeService from "services/youtubeService.js";
import * as historyService from "services/historyService.js";
import { programConfig } from "config";
import { initializeNumberInputHandlers } from "./active-exercise-card.numberInputHandler.js";
import * as selectorService from "services/selectorService.js";

/**
 * CEMENTED: Targeted Header Renderer
 * This function is designed to be called rapidly by the clock service.
 * It ONLY updates the header portion of the active card, which is essential
 * for performance to avoid re-rendering the entire card every second.
 */
export function renderActiveCardHeader() {
  const headerContainer = document.getElementById("active-card-header");
  if (!headerContainer) return;

  const remaining = appState.session.workoutTimeRemaining;
  const durationUnit = pluralize(remaining, "Minute", "Minutes");
  const durationText = `${remaining} ${durationUnit} Remaining`;
  const completionTime = calculateCompletionTime(remaining);

  // CEMENTED: carry the session color class on the entire second header line
  // so minute-tick re-renders cannot drop color even if a child span class is missed.
  const toneClass = appState.session.currentSessionColorClass || "";

  headerContainer.innerHTML = `
    <div class="card-header-line">
        <h2 class="card-header"><span class="truncate-text">${appState.session.activeCardHeaderMessage}</span></h2>
        <span class="card-header-clock">${appState.ui.currentTime}</span>
    </div>
    <div class="card-header-line ${toneClass}">
        <span class="card-header-dynamic-text truncate-text ${toneClass}">${durationText}</span>
        <span class="card-header-dynamic-text ${toneClass}">${completionTime}</span>
    </div>
  `;
}

export function renderActiveExerciseCard() {
  ui.mainContent.innerHTML = getActiveExerciseCardTemplate();
}

function flashInputError(inputId) {
  const buttons = document.querySelectorAll(
    `button[data-input-id="${inputId}"]`
  );
  buttons.forEach((button) => {
    button.classList.add("button-is-flashing");
    setTimeout(() => button.classList.remove("button-is-flashing"), 1700);
  });
}

export function handleNumberInputChange(inputId, value) {
  const cleanValue = Math.max(0, Math.min(999, parseFloat(value) || 0));
  const logEntry =
    appState.session.workoutLog[appState.session.currentLogIndex];
  if (!logEntry) return;

  if (inputId === "weight") logEntry.weight = cleanValue;
  else if (inputId === "reps") logEntry.reps = cleanValue;
}

export function handleLogSet(side = null) {
  selectorService.closeAll();
  const sourceLogEntry =
    appState.session.workoutLog[appState.session.currentLogIndex];
  if (!sourceLogEntry) return false;

  let targetLogEntry, targetIndex;

  if (appState.superset.isActive || appState.partner.isActive) {
    if (!side) return false;
    targetIndex = appState.session.workoutLog.findIndex(
      (log) => log.status === "pending" && log.supersetSide === side
    );
    if (targetIndex === -1) return false;
    targetLogEntry = appState.session.workoutLog[targetIndex];
    targetLogEntry.weight = sourceLogEntry.weight;
    targetLogEntry.reps = sourceLogEntry.reps;
  } else {
    targetIndex = appState.session.currentLogIndex;
    targetLogEntry = sourceLogEntry;
  }

  if (targetLogEntry.weight === 0 || targetLogEntry.reps === 0) {
    if (targetLogEntry.weight === 0) flashInputError("weight");
    if (targetLogEntry.reps === 0) flashInputError("reps");
    return false;
  }

  targetLogEntry.status = "completed";
  targetLogEntry.timestamp = formatTimestamp(new Date());
  targetLogEntry.isAnimating = true;
  historyService.addOrUpdateLog(targetLogEntry);
  setTimeout(() => {
    targetLogEntry.isAnimating = false;
  }, 1700);

  const hasMoreOverallPending = appState.session.workoutLog.some(
    (log) => log.status === "pending"
  );

  if (hasMoreOverallPending) {
    if (appState.superset.isActive || appState.partner.isActive) {
      const target = side === "left" ? "supersetLeft" : "supersetRight";
      appState.session.lastLoggedSet[target] = {
        index: targetIndex,
        weight: targetLogEntry.weight,
        reps: targetLogEntry.reps,
      };
      const hasMoreSetsOnThisSide = appState.session.workoutLog.some(
        (log) => log.status === "pending" && log.supersetSide === side
      );
      if (hasMoreSetsOnThisSide) {
        startSupersetRestTimer(side, "log");
      } else {
        workoutService.recalculateCurrentStateAfterLogChange();
        workoutService.updateWorkoutCompletionState();
      }
    } else {
      appState.session.lastLoggedSet.normal = {
        index: targetIndex,
        weight: targetLogEntry.weight,
        reps: targetLogEntry.reps,
      };
      startNormalRestTimer("log");
    }
  } else {
    workoutService.updateWorkoutCompletionState();
    workoutService.recalculateCurrentStateAfterLogChange();
  }
  return true;
}

export function handleSkipSet(side = null) {
  selectorService.closeAll();
  let targetLogEntry, targetIndex;
  const sourceLogEntry =
    appState.session.workoutLog[appState.session.currentLogIndex];
  if (!sourceLogEntry) return;

  if (appState.superset.isActive || appState.partner.isActive) {
    if (!side) return;
    targetIndex = appState.session.workoutLog.findIndex(
      (log) => log.status === "pending" && log.supersetSide === side
    );
    if (targetIndex === -1) return;
    targetLogEntry = appState.session.workoutLog[targetIndex];
  } else {
    targetIndex = appState.session.currentLogIndex;
    targetLogEntry = sourceLogEntry;
  }
  if (!targetLogEntry) return;

  targetLogEntry.status = "skipped";
  targetLogEntry.timestamp = formatTimestamp(new Date());
  historyService.addOrUpdateLog(targetLogEntry);

  const hasMoreOverallPending = appState.session.workoutLog.some(
    (log) => log.status === "pending"
  );

  if (hasMoreOverallPending) {
    const lastLoggedData = {
      index: targetIndex,
      weight: sourceLogEntry.weight,
      reps: sourceLogEntry.reps,
    };
    if (appState.superset.isActive || appState.partner.isActive) {
      const target = side === "left" ? "supersetLeft" : "supersetRight";
      appState.session.lastLoggedSet[target] = lastLoggedData;
      if (
        appState.superset.isActive &&
        appState.superset.timeDeductionSetIndexes.includes(targetIndex)
      ) {
        appState.superset.bonusMinutes = Math.max(
          0,
          appState.superset.bonusMinutes - 1
        );
      }
      const hasMoreSetsOnThisSide = appState.session.workoutLog.some(
        (log) => log.status === "pending" && log.supersetSide === side
      );
      if (hasMoreSetsOnThisSide) {
        // CEMENTED FIX: Corrected typo from startSupersetRestimer to startSupersetRestTimer.
        startSupersetRestTimer(side, "skip");
      } else {
        workoutService.recalculateCurrentStateAfterLogChange();
        workoutService.updateWorkoutCompletionState();
      }
    } else {
      appState.session.lastLoggedSet.normal = lastLoggedData;
      startNormalRestTimer("skip");
    }
  } else {
    workoutService.updateWorkoutCompletionState();
    workoutService.recalculateCurrentStateAfterLogChange();
  }
}

export function handleSkipRest(side = null) {
  if (appState.superset.isActive || appState.partner.isActive) {
    if (!side) return;
    handleSupersetRestCompletion(side, { wasSkipped: true });
  } else {
    handleNormalRestCompletion({ wasSkipped: true });
  }
}

export function handleExerciseSwap(newExerciseOrder) {
  const logIndex = appState.session.currentLogIndex;
  const currentLogEntry = appState.session.workoutLog[logIndex];
  const targetMuscleGroup = currentLogEntry.exercise.muscle_group;
  const currentPlan = programConfig[appState.session.currentWorkoutPlanName];
  const dayForSwap =
    appState.superset.isActive || appState.partner.isActive
      ? currentLogEntry.exercise.day
      : appState.session.currentDayName;

  const newExercise = appState.allExercises.find(
    (ex) =>
      ex[currentPlan.orderKey] === newExerciseOrder &&
      ex.day === dayForSwap &&
      ex.muscle_group === targetMuscleGroup
  );
  if (!newExercise) return;

  const finalExerciseData = youtubeService.getExerciseWithLink(newExercise);

  const oldExerciseName = currentLogEntry.exercise.exercise_name;
  appState.session.workoutLog.forEach((log) => {
    if (
      log.exercise.exercise_name === oldExerciseName &&
      log.supersetSide === currentLogEntry.supersetSide
    ) {
      log.exercise = finalExerciseData;
    }
  });

  workoutService.recalculateCurrentStateAfterLogChange();
}

export function initializeActiveCardEventListeners() {
  initializeNumberInputHandlers(handleNumberInputChange);
}
