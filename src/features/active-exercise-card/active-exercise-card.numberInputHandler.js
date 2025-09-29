import { appState } from "state";
import { isDumbbellExercise } from "utils";

/**
 * CEMENTED
 * This function encapsulates the entire complex logic for the press-and-hold
 * number input controls, including variable step increments and acceleration.
 * It is a self-contained, stable piece of UI interaction logic.
 */
export function initializeNumberInputHandlers(onInputChange) {
  let holdTimeoutId = null;
  let holdIntervalId = null;
  let accelerationTimeoutId = null;
  let isAccelerating = false;

  const handleHoldStart = (target) => {
    if (event.type === "touchstart") event.preventDefault();
    const logIndex = target.dataset.logIndex
      ? parseInt(target.dataset.logIndex, 10)
      : null;
    const direction = target.dataset.action;
    const isWeightInput = target.dataset.inputId.startsWith("weight");

    // 🔒 CEMENT: Exercise type detection for correct increment rules
    // Critical fix: Use logged exercise type, not current active exercise type
    // - If editing a logged set (logIndex provided), use that specific log entry's exercise
    // - If using main inputs (logIndex null), use current active exercise
    // This ensures dumbbell sets always use dumbbell increments regardless of workout progression
    const relevantLogEntry = logIndex !== null
      ? appState.session.workoutLog[logIndex]
      : appState.session.workoutLog[appState.session.currentLogIndex];
    const isDumbbell =
      relevantLogEntry && isDumbbellExercise(relevantLogEntry.exercise);

    const updateValue = () => {
      const input = document.getElementById(`${target.dataset.inputId}-input`);
      if (!input) return;
      const value = parseFloat(input.value) || 0;
      let stepHold = 0;
      let newValue = value;

      if (isWeightInput) {
        if (isDumbbell) {
          if (isAccelerating) {
            if (direction === "increment") {
              if (value < 20) stepHold = 5;
              else if (value < 50) stepHold = 10;
              else stepHold = 20;
            } else {
              if (value <= 20) stepHold = 5;
              else if (value <= 50) stepHold = 10;
              else stepHold = 20;
            }
          } else {
            if (direction === "increment") {
              if (value < 20) stepHold = 1;
              else if (value < 50) stepHold = 2.5;
              else stepHold = 5;
            } else {
              if (value <= 20) stepHold = 1;
              else if (value <= 50) stepHold = 2.5;
              else stepHold = 5;
            }
          }
        } else {
          stepHold = isAccelerating ? 20 : 5;
        }
      } else {
        stepHold = 1;
      }

      const step = direction === "increment" ? stepHold : -stepHold;
      newValue = value + step;

      if (isDumbbell && isWeightInput) {
        if (direction === "increment") {
          if (value < 20 && newValue >= 20) newValue = 20;
          if (value < 50 && newValue >= 50) newValue = 50;
        } else {
          if (value > 50 && newValue <= 50) newValue = 50;
          if (value > 20 && newValue <= 20) newValue = 20;
        }

        if (newValue > 20 && newValue < 50 && newValue % 2.5 !== 0) {
          if (direction === "increment") {
            newValue = Math.ceil(newValue / 2.5) * 2.5;
          } else {
            newValue = Math.floor(newValue / 2.5) * 2.5;
          }
        }
      }

      newValue = Math.max(0, Math.min(999, newValue));
      if (newValue % 1 !== 0) {
        input.value = newValue.toFixed(1);
      } else {
        input.value = newValue;
      }

      if (logIndex === null) {
        onInputChange(target.dataset.inputId, input.value);
      }
    };

    updateValue();

    holdTimeoutId = setTimeout(() => {
      holdIntervalId = setInterval(updateValue, 150);
      if (isWeightInput) {
        accelerationTimeoutId = setTimeout(() => {
          isAccelerating = true;
        }, 1200);
      }
    }, 400);
  };

  const handleHoldEnd = () => {
    clearTimeout(holdTimeoutId);
    clearInterval(holdIntervalId);
    clearTimeout(accelerationTimeoutId);
    isAccelerating = false;
  };

  document.body.addEventListener("mousedown", (event) => {
    const button = event.target.closest("button[data-input-id]");
    if (button) handleHoldStart(button);
  });
  document.body.addEventListener(
    "touchstart",
    (event) => {
      const button = event.target.closest("button[data-input-id]");
      if (button) handleHoldStart(button);
    },
    { passive: false }
  );

  document.body.addEventListener("mouseup", handleHoldEnd);
  document.body.addEventListener("mouseleave", handleHoldEnd);
  document.body.addEventListener("touchend", handleHoldEnd);
}
