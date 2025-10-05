import { appState } from "state";
import { ui } from "ui";
import { timeOptions } from "config";
import { getConfigCardTemplate } from "./config-card.template.js";
import * as navigationService from "services/core/navigationService.js";

/* ==========================================================================
   CONFIG CARD - State management and change handlers

   Handles configuration state changes for plan, day, and time selections.
   Provides state snapshot/restore functionality for cancel operations.
   Manages default reset behavior.
   ========================================================================== */

// Store state snapshot for cancel/restore operations
let stateSnapshot = null;

/* === RENDERING === */
export function renderConfigCard() {
  ui.configSection.innerHTML = getConfigCardTemplate();
}

/* === PLAN CHANGE HANDLER === */
export function handlePlanChange(newPlanName) {
  if (appState.session.currentWorkoutPlanName === newPlanName) return;
  appState.session.currentWorkoutPlanName = newPlanName;
}

/* === DAY CHANGE HANDLER === */
/* 🔒 CEMENT: Current Focus selector controls timer colors only */
export function handleDayChange(newDayName) {
  if (appState.superset.isActive || appState.partner.isActive) {
    navigationService.setNormalMode();
  }

  if (
    appState.session.currentDayName === newDayName &&
    !appState.superset.isActive &&
    !appState.partner.isActive
  )
    return;

  appState.session.currentDayName = newDayName;

  // 🔒 CEMENT: Current Focus selector determines timer and fuel gauge colors
  // Today = green (text-plan), Any other day = olive (text-deviation)
  const timerColorClass = newDayName === appState.todayDayName ? "text-plan" : "text-deviation";
  appState.session.currentTimerColorClass = timerColorClass;
}

/* === TIME CHANGE HANDLER === */
/* 🔒 CEMENT: Current Session selector controls header colors only */
export function handleTimeChange(newTimeOption) {
  if (appState.session.currentTimeOptionName === newTimeOption) return;
  appState.session.currentTimeOptionName = newTimeOption;
  const selectedOption = timeOptions.find((t) => t.name === newTimeOption);
  if (selectedOption) {
    // Updates header colors (Minutes Remaining, clock) - NOT timer colors
    appState.session.currentSessionColorClass = selectedOption.colorClass;
  }
}

/* === STATE SNAPSHOT/RESTORE === */
export function saveConfigState() {
  stateSnapshot = {
    // Session config
    currentWorkoutPlanName: appState.session.currentWorkoutPlanName,
    currentDayName: appState.session.currentDayName,
    currentTimeOptionName: appState.session.currentTimeOptionName,
    currentTimerColorClass: appState.session.currentTimerColorClass,
    currentSessionColorClass: appState.session.currentSessionColorClass,
    // Superset mode state
    supersetIsActive: appState.superset.isActive,
    supersetDay1: appState.superset.day1,
    supersetDay2: appState.superset.day2,
    supersetBonusMinutes: appState.superset.bonusMinutes,
    // Partner mode state
    partnerIsActive: appState.partner.isActive,
    partnerUser1Name: appState.partner.user1Name,
    partnerUser1Day: appState.partner.user1Day,
    partnerUser2Name: appState.partner.user2Name,
    partnerUser2Day: appState.partner.user2Day,
  };
}

export function restoreConfigState() {
  if (!stateSnapshot) return;

  // Restore session config
  appState.session.currentWorkoutPlanName = stateSnapshot.currentWorkoutPlanName;
  appState.session.currentDayName = stateSnapshot.currentDayName;
  appState.session.currentTimeOptionName = stateSnapshot.currentTimeOptionName;
  appState.session.currentTimerColorClass = stateSnapshot.currentTimerColorClass;
  appState.session.currentSessionColorClass = stateSnapshot.currentSessionColorClass;

  // Restore superset mode state
  appState.superset.isActive = stateSnapshot.supersetIsActive;
  appState.superset.day1 = stateSnapshot.supersetDay1;
  appState.superset.day2 = stateSnapshot.supersetDay2;
  appState.superset.bonusMinutes = stateSnapshot.supersetBonusMinutes;

  // Restore partner mode state
  appState.partner.isActive = stateSnapshot.partnerIsActive;
  appState.partner.user1Name = stateSnapshot.partnerUser1Name;
  appState.partner.user1Day = stateSnapshot.partnerUser1Day;
  appState.partner.user2Name = stateSnapshot.partnerUser2Name;
  appState.partner.user2Day = stateSnapshot.partnerUser2Day;

  stateSnapshot = null;
}

export function clearConfigState() {
  stateSnapshot = null;
}

/* === RESET TO DEFAULTS === */
export function resetToDefaults() {
  // Reset to daily defaults
  appState.session.currentWorkoutPlanName = "Will's 3-2-1:";
  appState.session.currentDayName = appState.todayDayName;
  appState.session.currentTimeOptionName = "Recommended:";

  // Reset timer and session colors to green (plan)
  appState.session.currentTimerColorClass = "text-plan";
  appState.session.currentSessionColorClass = "text-plan";

  // Exit any special modes (superset/partner)
  appState.superset.isActive = false;
  appState.superset.day1 = null;
  appState.superset.day2 = null;
  appState.superset.bonusMinutes = 0;

  appState.partner.isActive = false;
  appState.partner.user1Name = "Will";
  appState.partner.user1Day = null;
  appState.partner.user2Name = "Guest";
  appState.partner.user2Day = null;
}
