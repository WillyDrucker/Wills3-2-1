import { appState } from "state";
import { createSelectorHTML } from "ui";

export function getDaySelectorHTML(isAnySetLogged) {
  const { superset, partner, session } = appState;
  let summaryHtml;
  if (superset.isActive) {
    const day1Info = appState.weeklyPlan[superset.day1];
    const day2Info = appState.weeklyPlan[superset.day2];
    summaryHtml = `<div class="selector-content"><div class="item-main-line flex-line-container"><span class="flex-priority">Superset:&nbsp;</span><span class="flex-priority data-highlight text-plan">${day1Info.title}</span><span class="flex-priority text-on-surface-medium">&nbsp;&amp;&nbsp;</span><span class="truncate-text data-highlight text-warning">${day2Info.title}</span></div></div>`;
  } else if (partner.isActive) {
    summaryHtml = `<div class="selector-content"><div class="item-main-line flex-line-container"><span class="flex-priority">Partner:&nbsp;</span><span class="flex-priority data-highlight text-plan">${partner.user1Name}</span><span class="flex-priority text-on-surface-medium">&nbsp;&amp;&nbsp;</span><span class="truncate-text data-highlight text-primary">${partner.user2Name}</span></div></div>`;
  } else {
    const { currentDayName } = session;
    const colorClass =
      currentDayName === appState.todayDayName ? "text-plan" : "text-deviation";
    const dayInfo = appState.weeklyPlan[currentDayName];
    const display =
      dayInfo.title === "Rest"
        ? dayInfo.title
        : `${dayInfo.title} (${dayInfo.type})`;
    summaryHtml = `<div class="selector-content"><div class="item-main-line flex-line-container"><span class="flex-priority">${currentDayName}:&nbsp;</span><span class="truncate-text data-highlight ${colorClass}">${display}</span></div></div>`;
  }
  const allDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const todayIndex = allDays.indexOf(appState.todayDayName);
  const chronologicallyOrderedDays = [
    ...allDays.slice(todayIndex),
    ...allDays.slice(0, todayIndex),
  ];
  let optionsHtml = chronologicallyOrderedDays
    .filter(
      (day) =>
        superset.isActive ||
        partner.isActive ||
        day !== appState.session.currentDayName
    )
    .map((day) => {
      const workout = appState.weeklyPlan[day];
      const colorClass =
        day === appState.todayDayName ? "text-plan" : "text-deviation";
      const display =
        workout.title === "Rest"
          ? workout.title
          : `${workout.title} (${workout.type})`;
      return `<li data-day="${day}"><div class="item-main-line flex-line-container"><span class="flex-priority text-info">${day}:&nbsp;</span><span class="truncate-text data-highlight ${colorClass}">${display}</span></div></li>`;
    })
    .join("");
  const isSelectorDisabled = isAnySetLogged;
  return createSelectorHTML(
    "day-selector-details",
    summaryHtml,
    optionsHtml,
    isSelectorDisabled
  );
}
