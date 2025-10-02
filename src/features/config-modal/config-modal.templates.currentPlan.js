import { appState } from "state";
import { workoutPlans } from "config";
import { createSelectorHTML } from "ui";

export function getCurrentPlanSelectorHTML(isAnySetLogged) {
  const { superset, partner, session } = appState;
  let summaryHtml;
  if (superset.isActive) {
    const day1Info = appState.weeklyPlan[superset.day1];
    const day2Info = appState.weeklyPlan[superset.day2];
    summaryHtml = `<div class="selector-content"><div class="item-main-line flex-line-container"><div class="flex-truncate-group-rigid"><span class="flex-priority">Superset:&nbsp;</span><span class="data-highlight text-plan">${day1Info.title}</span><span class="flex-priority text-on-surface-medium">&nbsp;&amp;&nbsp;</span></div><span class="truncate-text data-highlight text-warning">${day2Info.title}</span></div></div>`;
  } else if (partner.isActive) {
    summaryHtml = `<div class="selector-content"><div class="item-main-line flex-line-container"><div class="flex-truncate-group-rigid"><span class="flex-priority">Partner:&nbsp;</span><span class="data-highlight text-plan">${partner.user1Name}</span><span class="flex-priority text-on-surface-medium">&nbsp;&amp;&nbsp;</span></div><span class="truncate-text data-highlight text-primary">${partner.user2Name}</span></div></div>`;
  } else {
    const currentPlan =
      workoutPlans.find((p) => p.name === session.currentWorkoutPlanName) ||
      workoutPlans[0];
    summaryHtml = `<div class="selector-content"><div class="item-main-line flex-line-container"><span class="flex-priority">${currentPlan.name}&nbsp;</span><span class="truncate-text data-highlight text-plan">${currentPlan.duration}</span></div></div>`;
  }
  const options = [];
  const isModeChangeDisabled = isAnySetLogged;

  // If in dual mode, allow return to normal mode
  if (superset.isActive || partner.isActive) {
    const itemClass = isModeChangeDisabled ? "is-muted" : "";
    options.push(
      `<li class="${itemClass}" data-action="setNormalMode"><div class="selector-content"><div class="item-main-line flex-line-container"><span class="flex-priority">${workoutPlans[0].name}&nbsp;</span><span class="truncate-text data-highlight text-plan">${workoutPlans[0].duration}</span></div></div></li>`
    );
  }

  // Mode options (Superset and Partner)
  options.push(
    `<li class="${
      isModeChangeDisabled ? "is-muted" : ""
    }" data-action="openSupersetModal"><div class="selector-content multi-line balanced-text"><span class="truncate-text">Superset Mode:</span><span class="truncate-text text-warning">Two Body Parts, Same Day</span></div></li>`
  );
  options.push(
    `<li class="${
      isModeChangeDisabled ? "is-muted" : ""
    }" data-action="openPartnerMode"><div class="selector-content multi-line balanced-text"><span class="truncate-text">Partner Mode:</span><span class="truncate-text text-primary">Two Lifters, Same Day</span></div></li>`
  );

  return createSelectorHTML(
    "config-modal-plan-selector",
    summaryHtml,
    options.join(""),
    false,
    isAnySetLogged && (superset.isActive || partner.isActive)
  );
}