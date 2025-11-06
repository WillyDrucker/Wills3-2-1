/* ==========================================================================
   MY PLAN - Page Template

   Generates My Plan page HTML with Current Plan selector and duration
   information. Displays available training plans and week calculations.

   Dependencies: appState, createSelectorHTML
   Used by: my-plan.index.js (renderMyPlanPage)
   ========================================================================== */

import { appState } from "state";
import { createSelectorHTML } from "utils";
import { getRemainingWeeks, getWeeksRemaining } from "../../shared/utils/planWeekUtils.js";

/**
 * Generate Current Plan selector HTML
 * Shows selected plan with total weeks: "[Plan Name]: 15 Weeks" (always shows full duration)
 * Plan name in gray, weeks in green
 */
function getCurrentPlanSelectorHTML() {
  const { selectedPlanId, activePlanId, currentWeekNumber } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  if (!plans || plans.length === 0) {
    return `<div class="selector-placeholder">Loading plans...</div>`;
  }

  // Find selected plan
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  // Always show total weeks (not remaining)
  const weeksToShow = selectedPlan.totalWeeks;
  const weeksText = weeksToShow === 1 ? "Week" : "Weeks";

  // Summary HTML (displays selected plan with remaining weeks)
  const summaryHtml = `<div class="selector-content plan-selector-content">
    <div class="item-main-line truncate-text">
      <span class="text-on-surface-medium">${selectedPlan.name}:&nbsp;</span><span class="data-highlight text-plan">${weeksToShow} ${weeksText}</span>
    </div>
  </div>`;

  // Options HTML (all other plans - always show total weeks)
  const optionsHtml = plans
    .filter((p) => p.id !== selectedPlanId)
    .map((plan) => {
      // Always show total weeks (not remaining)
      const planWeeksToShow = plan.totalWeeks;
      const planWeeksText = planWeeksToShow === 1 ? "Week" : "Weeks";

      // Add green border to active plan when viewing a different plan (visual indicator)
      const isViewingDifferentPlan = selectedPlanId !== activePlanId;
      const borderClass = (isViewingDifferentPlan && plan.id === activePlanId)
        ? "has-colored-border border-green"
        : "";

      return `<li data-plan-id="${plan.id}" class="plan-selector-option ${borderClass}">
        <div class="selector-content">
          <div class="item-main-line truncate-text">
            <span class="text-on-surface-medium">${plan.name}:&nbsp;</span><span class="data-highlight text-plan">${planWeeksToShow} ${planWeeksText}</span>
          </div>
        </div>
      </li>`;
    })
    .join("");

  return createSelectorHTML(
    "current-plan-selector",
    summaryHtml,
    optionsHtml,
    false // Never disabled
  );
}

/**
 * Generate duration info HTML
 * Shows total and remaining weeks for current plan
 * Left-aligned with gray labels and green values
 */
function getDurationInfoHTML() {
  const { selectedPlanId, activePlanId, startDate } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  if (!plans || plans.length === 0) {
    return "";
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const totalWeeks = selectedPlan.totalWeeks || 15;

  // Calculate remaining weeks only for active plan with start date
  const isActivePlan = activePlanId === selectedPlanId;
  const remainingWeeks = isActivePlan && startDate
    ? getRemainingWeeks(startDate, totalWeeks)
    : totalWeeks;

  const totalWeeksText = totalWeeks === 1 ? "Week" : "Weeks";
  const remainingWeeksText = remainingWeeks === 1 ? "Week" : "Weeks";

  return `<div class="plan-duration-section">
    <div class="plan-duration-line">
      <span class="text-on-surface-medium">Total Duration:&nbsp;</span><span class="data-highlight text-plan">${totalWeeks} ${totalWeeksText}</span>
    </div>
    <div class="plan-duration-line">
      <span class="text-on-surface-medium">Remaining Duration:&nbsp;</span><span class="data-highlight text-plan">${remainingWeeks} ${remainingWeeksText}</span>
    </div>
  </div>`;
}

/**
 * Generate week range boxes HTML
 * Shows 50px black boxes for each week range with rep counts, phases, and equipment
 * Replaces the old text-based phase chart with structured boxes
 * Note: Animation classes are added after render to trigger CSS animations
 */
function getWeekRangeBoxesHTML() {
  const { selectedPlanId } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  if (!plans || plans.length === 0) {
    return "";
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const phases = selectedPlan.phases || {};
  const equipmentWeeks = selectedPlan.equipmentWeeks || {};
  const weeklyReps = selectedPlan.weeklyReps || {};

  // Get all week range keys that have phase data
  const weekRanges = Object.keys(phases);

  if (weekRanges.length === 0) {
    return "";
  }

  // Sort week ranges (4-week groups before 3-week groups)
  const sortedRanges = sortWeekRanges(weekRanges);

  // Generate HTML for each week range box (without status classes - added after render)
  const weekRangeBoxesHtml = sortedRanges.map((weekRange, index) => {
    const phaseName = phases[weekRange];
    const equipment = equipmentWeeks[weekRange] || "";

    // Parse "week1-3" into start and end numbers
    const parsed = parseWeekRange(weekRange);
    if (!parsed) return "";

    // Calculate actual rep range from all weeks in the range
    const repValues = [];
    for (let week = parsed.start; week <= parsed.end; week++) {
      const weekKey = `week${week}`;
      const reps = weeklyReps[weekKey];
      if (reps !== undefined && reps !== null) {
        repValues.push(reps);
      }
    }

    // Display rep range in week order (e.g., "6-2" for first week to last week)
    let repRangeDisplay = "";
    if (repValues.length > 0) {
      const firstRep = repValues[0];
      const lastRep = repValues[repValues.length - 1];
      repRangeDisplay = firstRep === lastRep ? `${firstRep}` : `${firstRep}-${lastRep}`;
    }

    // Build display range (e.g., "Week 1-3")
    const displayRange = `Week ${parsed.start}-${parsed.end}`;

    // Build the 50px box with two lines (status classes added after render)
    // Line 1: Week label (left) | Rep Range (right)
    // Line 2: Phase name (left) | Equipment (right)
    return `<div class="week-range-box">
      <div class="week-range-line-1">
        <span class="week-range-label">${displayRange}</span>
        <span class="week-range-reps"><span class="week-range-reps-label">Reps:&nbsp;</span><span class="week-range-reps-value">${repRangeDisplay}</span></span>
      </div>
      <div class="week-range-line-2">
        <span class="week-range-phase">${phaseName}</span>
        <span class="week-range-equipment">${equipment}</span>
      </div>
    </div>`;
  }).join("");

  return `<div class="week-range-container">
    ${weekRangeBoxesHtml}
  </div>`;
}

/**
 * Parse week range key into start and end numbers
 * @param {string} key - Week range key like "week1-3" or "week4-6"
 * @returns {object|null} - Object with start and end numbers, or null if invalid
 */
function parseWeekRange(key) {
  const match = key.match(/week(\d+)-(\d+)/);
  if (!match) return null;
  return {
    start: parseInt(match[1], 10),
    end: parseInt(match[2], 10)
  };
}

/**
 * Sort week range keys chronologically with 4-week groups before 3-week groups
 * @param {array} keys - Array of week range keys
 * @returns {array} - Sorted array
 */
function sortWeekRanges(keys) {
  return keys.sort((a, b) => {
    const rangeA = parseWeekRange(a);
    const rangeB = parseWeekRange(b);

    if (!rangeA || !rangeB) return 0;

    // Primary sort: by start week (chronological order)
    if (rangeA.start !== rangeB.start) {
      return rangeA.start - rangeB.start;
    }

    // Secondary sort: longer ranges first (4-week before 3-week)
    return rangeB.end - rangeA.end;
  });
}

/* REMOVED: Old text-based phase chart replaced by getWeekRangeBoxesHTML()
 * The phase chart has been replaced with 50px structured boxes that match
 * the Today's Workout log styling. See getWeekRangeBoxesHTML() above.
 */

/**
 * Generate plan information HTML
 * Shows description text for selected plan
 */
function getPlanInformationHTML() {
  const { selectedPlanId } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  if (!plans || plans.length === 0) {
    return "Information...";
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  return selectedPlan.planInformation || "Information...";
}

/**
 * Generate Active Plan selector HTML
 * Static visual indicator showing the currently active plan with remaining weeks
 * Counts down as weeks advance, never opens
 */
function getActivePlanSelectorHTML() {
  const { activePlanId, currentWeekNumber } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  if (!plans || plans.length === 0 || !activePlanId) {
    return "";
  }

  const activePlan = plans.find((p) => p.id === activePlanId);
  if (!activePlan) return "";

  // Always calculate remaining weeks (counts down as weeks advance)
  const weeksToShow = currentWeekNumber
    ? getWeeksRemaining(activePlanId, currentWeekNumber, plans) || activePlan.totalWeeks
    : activePlan.totalWeeks;

  const weeksText = weeksToShow === 1 ? "Week" : "Weeks";

  // Static selector HTML (no options list, always disabled)
  return `<div class="selector-container active-plan-selector-container">
    <details class="app-selector" id="active-plan-selector" disabled>
      <summary class="active-plan-summary">
        <div class="selector-content plan-selector-content">
          <div class="item-main-line truncate-text">
            <span class="text-on-surface-medium">${activePlan.name}:&nbsp;</span><span class="data-highlight text-plan">${weeksToShow} ${weeksText}</span>
          </div>
        </div>
      </summary>
    </details>
  </div>`;
}

/**
 * Generate week navigation selector HTML
 * Always shows "Week #" with left/right navigation arrows for manual testing
 * Shows current week if plan active, otherwise defaults to Week 1
 * Positioned 16px below Current Plan selector
 */
function getWeekNavigationHTML() {
  const { selectedPlanId, currentWeekNumber, activePlanId } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  if (!selectedPlan) return "";

  const maxWeek = selectedPlan.totalWeeks || 15;

  // Show current week if this plan is active, otherwise default to Week 1
  const isActivePlan = activePlanId === selectedPlanId;
  const displayWeek = isActivePlan && currentWeekNumber ? currentWeekNumber : 1;

  // Disable previous button at Week 1
  const prevDisabled = displayWeek <= 1 ? "disabled" : "";

  // Disable next button at max week
  const nextDisabled = displayWeek >= maxWeek ? "disabled" : "";

  const weekText = `Week ${displayWeek}`;

  return `<div class="week-navigator plan-week-navigator">
    <button class="week-nav-button week-nav-prev week-chevron week-chevron-left" ${prevDisabled}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M20 24L12 16L20 8" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <span class="week-range-text text-plan">${weekText}</span>
    <button class="week-nav-button week-nav-next week-chevron week-chevron-right" ${nextDisabled}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M12 8L20 16L12 24" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>`;
}

/**
 * Generate Active Plan button HTML
 * Shows "Active Plan" (disabled) ONLY when viewing the active plan
 * Shows "Change Plan" (enabled) for all other plans
 */
function getActivePlanButtonHTML() {
  const { selectedPlanId, activePlanId } = appState.ui.myPlanPage;

  // Show "Active Plan" (disabled) ONLY when viewing the active plan
  const isActivePlan = activePlanId === selectedPlanId;
  const buttonText = isActivePlan ? "Active Plan" : "Change Plan";
  const disabledAttr = isActivePlan ? "disabled" : "";

  return `<button class="button-log plan-action-button" id="plan-action-button" data-action="changePlan" ${disabledAttr}>${buttonText}</button>`;
}

/**
 * Generate complete My Plan page template
 * Two cards: Current Plan (selector + duration + week range boxes) and Plan Information
 */
export function getMyPlanPageTemplate() {
  const selectorHtml = getCurrentPlanSelectorHTML();
  const activePlanSelectorHtml = getActivePlanSelectorHTML();
  const weekNavigationHtml = getWeekNavigationHTML();
  const durationHtml = getDurationInfoHTML();
  const weekRangeBoxesHtml = getWeekRangeBoxesHTML();
  const activePlanButtonHtml = getActivePlanButtonHTML();
  const planInfoHtml = getPlanInformationHTML();

  return `
    <div class="card my-plan-card" id="my-plan-card">
      <div class="card-content-container">
        <div class="card-title plan-card-title">Current Plan</div>
        <div class="selector-container plan-selector-container">
          ${selectorHtml}
        </div>
        <div class="card-title plan-card-title active-plan-title">Active Plan</div>
        ${activePlanSelectorHtml}
        ${durationHtml}
        ${weekRangeBoxesHtml}
        ${activePlanButtonHtml}
        ${weekNavigationHtml}
      </div>
    </div>

    <div class="card my-plan-card plan-info-card">
      <div class="card-content-container">
        <div class="card-title plan-info-title">Plan Information</div>
        <div class="plan-info-content">
          ${planInfoHtml}
        </div>
      </div>
    </div>
  `;
}
