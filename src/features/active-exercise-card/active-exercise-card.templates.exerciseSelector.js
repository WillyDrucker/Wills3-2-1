import { appState } from "state";
import { programConfig, colorCodeMap } from "config";

/*
  CEMENTED (v5.0.6 - Architectural Fix):
  This function now implements the definitive pattern for truncating multi-colored text.
  - The parent (.flex-line-container) is a flexbox.
  - The label part (.flex-priority) is rigid (flex-shrink: 0).
  - The value part (.truncate-text) is flexible and handles the truncation.
  This ensures the ellipsis (...) correctly inherits the color of the VALUE, not the label.
  This also fixes the truncation order, forcing the secondary text to truncate first.
*/
function getSummaryLineHTML(
  mainText,
  secondaryText,
  colorClass,
  isMain = true,
  skipLabel = false,
  labelText = ""
) {
  const lineClass = isMain ? "item-main-line" : "item-sub-line";

  // For main line (exercise name), no label needed
  const mainTextSpan = isMain
    ? `<span class="selector-value-wrapper truncate-text data-highlight ${colorClass}">${mainText}${secondaryText ? `<span class="flex-separator"> - </span>${secondaryText}` : ""}</span>`
    : skipLabel
    ? `<span class="selector-value-wrapper truncate-text data-highlight ${colorClass}">${mainText}${secondaryText ? `<span class="flex-separator"> - </span>${secondaryText}` : ""}</span>`
    : `<span class="selector-ui-label">${labelText}</span><span class="selector-value-wrapper truncate-text data-highlight ${colorClass}">${mainText}${secondaryText ? `<span class="flex-separator"> - </span>${secondaryText}` : ""}</span>`;

  return `<div class="${lineClass}">
              ${mainTextSpan}
            </div>`;
}

function getSwapOptionHTML(opt, currentPlan) {
  const colorClass = colorCodeMap[opt[currentPlan.colorKey]] || "text-plan";
  return `<li data-exercise-swap="${
    opt[currentPlan.orderKey]
  }"><div class="selector-content">${getSummaryLineHTML(
    opt.exercise_name,
    opt.position,
    colorClass,
    true
  )}${getSummaryLineHTML(
    opt.equipment_use,
    opt.equipment_weight,
    colorClass,
    false,
    false,
    "Equipment: "
  )}</div></li>`;
}

export function getExerciseSelectorHTML(logEntry, setsForThisExercise) {
  const { exercise } = logEntry;
  const currentPlan = programConfig[appState.session.currentWorkoutPlanName];
  let colorClass = colorCodeMap[exercise[currentPlan.colorKey]] || "text-plan";

  if (appState.partner.isActive) {
    colorClass = logEntry.userColorClass;
  } else if (appState.superset.isActive && logEntry.supersetSide) {
    colorClass =
      logEntry.supersetSide === "left" ? "text-plan" : "text-warning";
  }

  const dayForSwap =
    appState.superset.isActive || appState.partner.isActive
      ? exercise.day
      : appState.session.currentDayName;

  const allExercisesInGroupForDay = appState.allExercises
    .filter(
      (ex) => ex.muscle_group === exercise.muscle_group && ex.day === dayForSwap
    )
    .sort((a, b) =>
      (a[currentPlan.orderKey] || "").localeCompare(
        b[currentPlan.orderKey] || ""
      )
    );
  const validOptions = allExercisesInGroupForDay.filter(
    (ex) =>
      ex[currentPlan.colorKey] !== "red" &&
      ex[currentPlan.orderKey] !== exercise[currentPlan.orderKey]
  );
  const noteOptions = allExercisesInGroupForDay.filter(
    (ex) => ex[currentPlan.colorKey] === "red"
  );
  const optionsHtml =
    validOptions.map((opt) => getSwapOptionHTML(opt, currentPlan)).join("") +
    noteOptions
      .map(
        (opt) =>
          `<li class="is-note"><span class="text-skip truncate-text">${opt.exercise_name}</span></li>`
      )
      .join("");

  let isSelectorDisabled;
  if (appState.superset.isActive || appState.partner.isActive) {
    const currentSide = logEntry.supersetSide;
    isSelectorDisabled = appState.session.workoutLog.some(
      (log) =>
        log.supersetSide === currentSide &&
        log.exercise.muscle_group === exercise.muscle_group &&
        log.status !== "pending"
    );
  } else {
    isSelectorDisabled = appState.session.workoutLog.some(
      (log) =>
        log.exercise.muscle_group === exercise.muscle_group &&
        log.status !== "pending"
    );
  }

  // CEMENTED (Color Authority): The set count color is ALWAYS driven by the
  // "Current Session" selector's state (`appState.session.currentSessionColorClass`).
  // This is the single source of truth for set count color across the app.
  const setInfoLine = `<div class="item-sub-line"><span class="selector-ui-label">Set: </span><span class="selector-value-wrapper truncate-text data-highlight ${appState.session.currentSessionColorClass}">${logEntry.setNumber} of ${setsForThisExercise}</span></div>`;

  return `
      <details class="app-selector ${
        isSelectorDisabled ? "is-muted" : ""
      }" id="exercise-selector">
        <summary>
          <div class="selector-content">
            ${getSummaryLineHTML(
              exercise.exercise_name,
              exercise.position,
              colorClass
            )}
            ${getSummaryLineHTML(
              exercise.equipment_use,
              exercise.equipment_weight,
              colorClass,
              false,
              false,
              "Equipment: "
            ).replace('class="item-sub-line', 'class="item-sub-line equipment-line')}
            <div class="item-sub-line setup-line"><span class="selector-ui-label">Setup: </span><span class="selector-value-wrapper truncate-text data-highlight ${colorClass}">${
    (exercise.equipment_setup || "").trim() || "N/A"
  }</span></div>
            ${setInfoLine.replace('class="item-sub-line', 'class="item-sub-line set-line')}
          </div>
        </summary>
        <ul class="options-list">${optionsHtml}</ul>
      </details>`;
}
