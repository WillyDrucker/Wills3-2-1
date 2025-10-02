import { appState } from "state";
import { timeOptions } from "config";
import { createSelectorHTML } from "ui";
import { getDurationUnit } from "utils";
import * as workoutMetricsService from "services/workoutMetricsService.js";
import * as workoutFactoryService from "services/workoutFactoryService.js";
import { canCycleToSession } from "utils/sessionValidation.js";

export function getTimeSelectorHTML(isAnySetLogged) {
  const { superset, partner, session } = appState;
  const { currentTimeOptionName } = session;
  const currentTime =
    timeOptions.find((t) => t.name === currentTimeOptionName) || timeOptions[0];
  let totalDuration;
  if (superset.isActive) {
    const metrics = workoutMetricsService.calculateSupersetWorkoutMetrics(
      superset.day1,
      superset.day2,
      currentTime.name
    );
    totalDuration = metrics.duration;
  } else if (partner.isActive) {
    const metrics = workoutMetricsService.calculateSupersetWorkoutMetrics(
      partner.user1Day,
      partner.user2Day,
      currentTime.name
    );
    totalDuration = metrics.duration;
  } else {
    const tempWorkoutForSummary = workoutFactoryService.generateWorkoutLog(
      true,
      currentTime.type
    );
    const { duration } = workoutMetricsService.calculateWorkoutMetrics(
      tempWorkoutForSummary
    );
    totalDuration = duration;
  }
  const totalDurationText = `${totalDuration} ${getDurationUnit(
    totalDuration
  )}`;
  const summaryHtml = `<div class="selector-content"><div class="item-main-line flex-line-container"><span class="flex-priority">${currentTime.name}&nbsp;</span><span class="truncate-text data-highlight ${currentTime.colorClass}">${totalDurationText}</span></div></div>`;
  const optionsHtml = timeOptions
    .filter((opt) => opt.name !== currentTime.name)
    .map((opt) => {
      let duration;
      if (superset.isActive) {
        const metrics = workoutMetricsService.calculateSupersetWorkoutMetrics(
          superset.day1,
          superset.day2,
          opt.name
        );
        duration = metrics.duration;
      } else if (partner.isActive) {
        const metrics = workoutMetricsService.calculateSupersetWorkoutMetrics(
          partner.user1Day,
          partner.user2Day,
          opt.name
        );
        duration = metrics.duration;
      } else {
        const tempLog = workoutFactoryService.generateWorkoutLog(
          true,
          opt.type
        );
        duration =
          workoutMetricsService.calculateWorkoutMetrics(tempLog).duration;
      }
      const durationText = `${duration} ${getDurationUnit(duration)}`;
      // 🔒 CEMENT: Mute option if validation fails (would remove logged sets)
      const isMuted = !canCycleToSession(opt.name);
      const mutedClass = isMuted ? ' class="is-muted"' : '';
      return `<li data-time="${opt.name}"${mutedClass}><div class="item-main-line flex-line-container"><span class="flex-priority text-info">${opt.name}&nbsp;</span><span class="truncate-text data-highlight ${opt.colorClass}">${durationText}</span></div></li>`;
    })
    .join("");
  const isSelectorDisabled = isAnySetLogged;
  return createSelectorHTML(
    "config-modal-time-selector",
    summaryHtml,
    optionsHtml,
    isSelectorDisabled
  );
}
