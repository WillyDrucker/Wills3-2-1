import { appState } from "state";
import { formatTime } from "utils";
import * as workoutService from "services/workoutService.js";

let renderers = {};
export function initialize(rendererCallbacks) {
  renderers = rendererCallbacks;
}

let visibilityChangeHandler = null;

function handleTimerVisibilityChange() {
  if (document.visibilityState !== "visible") return;

  const resyncTimer = (restState) => {
    if (restState.type === "none" || !restState.startTime) return;

    const elapsedSeconds = Math.floor(
      (Date.now() - restState.startTime) / 1000
    );
    const newTimeRemaining = Math.max(0, 300 - elapsedSeconds);

    if (newTimeRemaining !== restState.timeRemaining) {
      restState.timeRemaining = newTimeRemaining;
      const minutesElapsed = Math.floor(elapsedSeconds / 60);

      for (let i = 0; i < 5; i++) {
        if (i < minutesElapsed) {
          restState.completedSegments[i] = true;
        }
      }
    }
  };

  resyncTimer(appState.rest.normal);
  resyncTimer(appState.rest.superset.left);
  resyncTimer(appState.rest.superset.right);

  if (appState.ui.currentPage === "workout") {
    renderers.renderAll();
  }
}

function _createTimerInterval(restState, side = null) {
  let lastMinutesElapsed = Math.floor((300 - restState.timeRemaining) / 60);

  restState.timerId = setInterval(() => {
    const elapsedSeconds = Math.floor(
      (Date.now() - restState.startTime) / 1000
    );
    restState.timeRemaining = Math.max(0, 300 - elapsedSeconds);

    if (appState.ui.currentPage === "workout") {
      const timerSelector = side
        ? `.timer-display[data-side="${side}"]`
        : ".timer-display";
      const timerDisplay = document.querySelector(timerSelector);
      if (timerDisplay) {
        timerDisplay.textContent = formatTime(restState.timeRemaining);
      }
    }

    const currentMinutesElapsed = Math.floor(elapsedSeconds / 60);
    if (currentMinutesElapsed > lastMinutesElapsed) {
      lastMinutesElapsed = currentMinutesElapsed;
      workoutService.updateWorkoutTimeRemaining();

      if (appState.ui.currentPage === "workout") {
        renderers.renderConfigCard();

        if (currentMinutesElapsed > 0 && currentMinutesElapsed <= 5) {
          const segmentIndex = currentMinutesElapsed - 1;
          if (restState.completedSegments[segmentIndex] === false) {
            restState.completedSegments[segmentIndex] = true;
            restState.animatingSegments[segmentIndex] = true;
            renderers.renderActiveExerciseCard();
            setTimeout(() => {
              if (restState.timerId && appState.ui.currentPage === "workout") {
                restState.animatingSegments[segmentIndex] = false;
                renderers.renderActiveExerciseCard();
              }
            }, 1200);
          }
        }
      }
    }

    if (
      side &&
      appState.superset.isActive &&
      appState.superset.timeDeductionSetIndexes.includes(
        restState.triggeringSetIndex
      ) &&
      restState.timeRemaining === 30 &&
      appState.superset.bonusMinutes > 0
    ) {
      appState.superset.bonusMinutes--;
      if (appState.ui.currentPage === "workout") {
        workoutService.updateWorkoutTimeRemaining();
        renderers.renderConfigCard();
      }
    }

    if (restState.timeRemaining <= 0) {
      _handleCompletion(restState, { wasSkipped: false });
    }
  }, 1000);
}

function _startTimer(restState, type, side = null) {
  if (restState.timerId) clearInterval(restState.timerId);

  /*
    CEMENTED (v5.0.2)
    This is the definitive logic for the dynamic "Next Exercise Up" header.
    It is the single source of truth for this state change.
    - In Normal mode, the header changes immediately.
    - In Superset/Partner mode, it only changes if the *other* side's timer is
      already running, indicating a true "next up" state for the user.
  */
  if (!side) {
    appState.session.activeCardHeaderMessage = "Next Exercise Up";
  } else {
    const isLeftActive = appState.rest.superset.left.type !== "none";
    const isRightActive = appState.rest.superset.right.type !== "none";
    if (
      (side === "left" && isRightActive) ||
      (side === "right" && isLeftActive)
    ) {
      appState.session.activeCardHeaderMessage = "Next Exercise Up";
    }
  }

  workoutService.advanceToNextExercise();

  const lastLoggedSet = side
    ? appState.session.lastLoggedSet[
        side === "left" ? "supersetLeft" : "supersetRight"
      ]
    : appState.session.lastLoggedSet.normal;

  Object.assign(restState, {
    type,
    startTime: Date.now(),
    timeRemaining: 300,
    completedSegments: Array(5).fill(false),
    animatingSegments: Array(5).fill(false),
    isFadingOut: false,
    triggeringSetIndex: lastLoggedSet.index,
    triggeringCycleId: Date.now(),
  });

  if (!visibilityChangeHandler) {
    visibilityChangeHandler = handleTimerVisibilityChange;
    document.addEventListener("visibilitychange", visibilityChangeHandler);
  }

  workoutService.updateWorkoutTimeRemaining();
  renderers.renderAll();
  _createTimerInterval(restState, side);
}

function _handleCompletion(restState, options = {}) {
  const cycleId = restState.triggeringCycleId;
  if (restState.type === "none" && !options.wasSkipped) return;
  if (restState.timerId) clearInterval(restState.timerId);
  restState.timerId = null;

  /*
    CEMENTED (v5.0.2)
    This is the definitive logic for resetting the dynamic header. It is the
    single source of truth for this state change. It ensures that whenever any
    timer completes or is skipped, the header reliably reverts to its default state.
  */
  appState.session.activeCardHeaderMessage = "Current Exercise";

  const log = appState.session.workoutLog[restState.triggeringSetIndex];
  if (log) {
    log.restCompleted = true;
    if (options.wasSkipped) {
      log.restWasSkipped = true;
      log.skippedRestValue = restState.timeRemaining;
    }
  }

  restState.finalAnimationType = restState.type;
  restState.isFadingOut = true;
  restState.type = "none";
  restState.animationStartTime = Date.now();

  if (
    visibilityChangeHandler &&
    appState.rest.normal.type === "none" &&
    appState.rest.superset.left.type === "none" &&
    appState.rest.superset.right.type === "none"
  ) {
    document.removeEventListener("visibilitychange", visibilityChangeHandler);
    visibilityChangeHandler = null;
  }

  workoutService.recalculateCurrentStateAfterLogChange({ shouldScroll: true });
  workoutService.updateWorkoutTimeRemaining();
  workoutService.updateWorkoutCompletionState();

  if (
    appState.ui.currentPage === "workout" &&
    !appState.ui.videoPlayer.isVisible
  ) {
    renderers.renderAll();
  }

  setTimeout(() => {
    if (restState.triggeringCycleId === cycleId) {
      restState.isFadingOut = false;
      restState.finalAnimationType = "none";
      restState.triggeringSetIndex = null;
      restState.animationStartTime = null;
      restState.timeRemaining = 300;
    }
  }, 4000);
}

export function startNormalRestTimer(type) {
  _startTimer(appState.rest.normal, type);
}

export function handleNormalRestCompletion(options = {}) {
  _handleCompletion(appState.rest.normal, options);
}

export function startSupersetRestTimer(side, type) {
  _startTimer(appState.rest.superset[side], type, side);
}

export function handleSupersetRestCompletion(side, options = {}) {
  _handleCompletion(appState.rest.superset[side], options);
}

export function resumeTimersFromState() {
  const resume = (restState, side = null) => {
    if (restState.type === "none" || !restState.startTime) return;

    const elapsedSeconds = Math.floor(
      (Date.now() - restState.startTime) / 1000
    );
    const newTimeRemaining = Math.max(0, 300 - elapsedSeconds);

    restState.timeRemaining = newTimeRemaining;

    const minutesElapsed = Math.floor(elapsedSeconds / 60);
    for (let i = 0; i < 5; i++) {
      if (i < minutesElapsed) {
        restState.completedSegments[i] = true;
      }
    }

    if (newTimeRemaining <= 0) {
      _handleCompletion(restState, { wasSkipped: false });
    } else {
      _createTimerInterval(restState, side);
    }
  };

  resume(appState.rest.normal);
  resume(appState.rest.superset.left, "left");
  resume(appState.rest.superset.right, "right");
}
