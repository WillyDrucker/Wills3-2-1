/* ==========================================================================
   MY PLAN - Page Template

   Generates My Plan page HTML with Current Plan selector and duration
   information. Displays available training plans and week calculations.

   Dependencies: appState, createSelectorHTML
   Used by: my-plan.index.js (renderMyPlanPage)
   ========================================================================== */

import { appState } from "state";
import { createSelectorHTML } from "utils";

/**
 * Generate Current Plan selector HTML
 * Shows selected plan with "[Plan Name]: 15 Weeks" format
 * Plan name in gray, weeks in green
 */
function getCurrentPlanSelectorHTML() {
  const { selectedPlanId } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  if (!plans || plans.length === 0) {
    return `<div class="selector-placeholder">Loading plans...</div>`;
  }

  // Find selected plan
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const weeksText = selectedPlan.totalWeeks === 1 ? "Week" : "Weeks";

  // Summary HTML (displays selected plan)
  const summaryHtml = `<div class="selector-content plan-selector-content">
    <div class="item-main-line truncate-text">
      <span class="text-on-surface-medium">${selectedPlan.name}:&nbsp;</span><span class="data-highlight text-plan">${selectedPlan.totalWeeks} ${weeksText}</span>
    </div>
  </div>`;

  // Options HTML (all other plans)
  const optionsHtml = plans
    .filter((p) => p.id !== selectedPlanId)
    .map((plan) => {
      const planWeeksText = plan.totalWeeks === 1 ? "Week" : "Weeks";
      return `<li data-plan-id="${plan.id}" class="plan-selector-option">
        <div class="selector-content">
          <div class="item-main-line truncate-text">
            <span class="text-on-surface-medium">${plan.name}:&nbsp;</span><span class="data-highlight text-plan">${plan.totalWeeks} ${planWeeksText}</span>
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
  const { selectedPlanId } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  if (!plans || plans.length === 0) {
    return "";
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const totalWeeks = selectedPlan.totalWeeks || 15;
  const remainingWeeks = selectedPlan.totalWeeks || 15; // TODO: Calculate based on start date

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

/**
 * Generate phase chart HTML
 * Shows week-by-week phases and equipment for current plan
 * Displays in Current Plan card below duration info
 */
function getPhaseChartHTML() {
  const { selectedPlanId } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  if (!plans || plans.length === 0) {
    return "";
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const phases = selectedPlan.phases || {};
  const equipmentWeeks = selectedPlan.equipmentWeeks || {};

  // Get all week range keys that have phase data
  const weekRanges = Object.keys(phases);

  if (weekRanges.length === 0) {
    return "";
  }

  // Sort week ranges (4-week groups before 3-week groups)
  const sortedRanges = sortWeekRanges(weekRanges);

  // Generate HTML for each phase line
  const phaseLinesHtml = sortedRanges.map((weekRange) => {
    const phaseName = phases[weekRange];
    const equipment = equipmentWeeks[weekRange] || "";

    // Parse "week1-3" into "Week 1-3:"
    const parsed = parseWeekRange(weekRange);
    if (!parsed) return "";

    const displayRange = `Week ${parsed.start}-${parsed.end}:`;

    // Build line with proper color styling
    return `<div class="phase-week-line">
      <span class="text-on-surface-medium">${displayRange}&nbsp;</span><span class="text-plan">${phaseName}</span><span class="text-on-surface-medium">&nbsp;-&nbsp;</span><span class="text-plan">${equipment}</span>
    </div>`;
  }).join("");

  return `<div class="phase-chart-container">
    ${phaseLinesHtml}
  </div>`;
}

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
 * Generate complete My Plan page template
 * Two cards: Current Plan (selector + duration + phase chart) and Plan Information
 */
export function getMyPlanPageTemplate() {
  const selectorHtml = getCurrentPlanSelectorHTML();
  const durationHtml = getDurationInfoHTML();
  const phaseChartHtml = getPhaseChartHTML();
  const planInfoHtml = getPlanInformationHTML();

  return `
    <div class="card my-plan-card" id="my-plan-card">
      <div class="card-content-container">
        <div class="card-title plan-card-title">Current Plan</div>
        <div class="selector-container plan-selector-container">
          ${selectorHtml}
        </div>
        ${durationHtml}
        ${phaseChartHtml}
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
