import { appState } from "state";
import { createSelectorHTML } from "ui";

/* ==========================================================================
   CONFIG CARD - Day Selector Template (Shared)

   CEMENT: Unified day selector used across all config contexts
   Displays current day's workout focus with chronologically-ordered options.
   Shows dual-mode info (Superset/Partner) when active.
   ========================================================================== */

export function getDaySelectorHTML(isAnySetLogged, selectorId = "day-selector-details") {
  const { superset, partner, session } = appState;
  let summaryHtml;
  if (superset.isActive) {
    const day1Info = appState.weeklyPlan[superset.day1];
    const day2Info = appState.weeklyPlan[superset.day2];
    summaryHtml = `<div class="selector-content"><div class="item-main-line flex-line-container"><span class="flex-priority">Superset:&nbsp;</span><span class="flex-priority data-highlight text-plan" data-animation-target="true">${day1Info.title}</span><span class="flex-priority text-on-surface-medium">&nbsp;&amp;</span><span class="truncate-text data-highlight text-warning" data-animation-target="true">&nbsp;${day2Info.title}</span></div></div>`;
  } else if (partner.isActive) {
    summaryHtml = `<div class="selector-content"><div class="item-main-line flex-line-container"><span class="flex-priority">Partner:&nbsp;</span><span class="flex-priority data-highlight text-plan" data-animation-target="true">${partner.user1Name}</span><span class="flex-priority text-on-surface-medium">&nbsp;&amp;</span><span class="truncate-text data-highlight text-primary" data-animation-target="true">&nbsp;${partner.user2Name}</span></div></div>`;
  } else {
    const { currentDayName } = session;
    const dayInfo = appState.weeklyPlan[currentDayName];
    // Today = green (text-plan), Any other day = olive (text-deviation)
    const colorClass = currentDayName === appState.todayDayName ? "text-plan" : "text-deviation";
    const display =
      dayInfo.title === "Rest"
        ? dayInfo.title
        : `${dayInfo.title} (${dayInfo.type})`;
    summaryHtml = `<div class="selector-content"><div class="item-main-line flex-line-container"><span class="flex-priority text-info">${currentDayName}:&nbsp;</span><span class="truncate-text data-highlight ${colorClass}" data-animation-target="true">${display}</span></div></div>`;
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
      // Today = green (text-plan), Any other day = olive (text-deviation)
      const colorClass = day === appState.todayDayName ? "text-plan" : "text-deviation";
      const display =
        workout.title === "Rest"
          ? workout.title
          : `${workout.title} (${workout.type})`;
      return `<li data-day="${day}"><div class="item-main-line flex-line-container"><span class="flex-priority text-info">${day}:&nbsp;</span><span class="truncate-text data-highlight ${colorClass}">${display}</span></div></li>`;
    })
    .join("");
  const isSelectorDisabled = isAnySetLogged;
  return createSelectorHTML(
    selectorId,
    summaryHtml,
    optionsHtml,
    isSelectorDisabled
  );
}
