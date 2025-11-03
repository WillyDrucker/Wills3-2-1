/* ==========================================================================
   MY PLAN - Page Logic and Event Handlers

   Manages My Plan page rendering, plan selection, and data loading.
   Loads training plans from JSON, handles plan switching, and updates
   duration calculations.

   Architecture: Page-level component
   - Loads plans from /data/plans.json on first render
   - Handles plan selector click events
   - Auto-closes selector on selection
   - Persists selected plan to localStorage

   Dependencies: appState, ui, getMyPlanPageTemplate, fetchPlans,
                 persistenceService, renderAll
   Used by: main.js (renderAll function)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getMyPlanPageTemplate } from "./my-plan.template.js";
import { fetchPlans } from "api/plansClient.js";
import * as persistenceService from "services/core/persistenceService.js";
import * as selectorService from "services/ui/selectorService.js";

/**
 * Render My Plan page
 * Loads plan data if not already loaded, then renders template
 */
export async function renderMyPlanPage() {
  // Load plans from JSON if not already loaded
  if (!appState.plan.plans || appState.plan.plans.length === 0) {
    const plans = await fetchPlans();
    if (plans) {
      appState.plan.plans = plans;

      // Set default plan if none selected
      if (!appState.ui.myPlanPage.selectedPlanId) {
        const defaultPlan = plans.find((p) => p.isDefault) || plans[0];
        appState.ui.myPlanPage.selectedPlanId = defaultPlan.id;
      }
    }
  }

  // Render template
  ui.mainContent.innerHTML = getMyPlanPageTemplate();

  // Wire up event listeners
  wireEventListeners();
}

/**
 * Wire up event listeners for plan selection
 * Handles plan selector option clicks
 */
function wireEventListeners() {
  const selector = document.getElementById("current-plan-selector");
  if (!selector) return;

  // Plan selector option clicks
  const options = selector.querySelectorAll(".plan-selector-option");
  options.forEach((option) => {
    option.addEventListener("click", handlePlanSelection);
  });
}

/**
 * Handle plan selection from dropdown
 * Updates selected plan, closes selector, saves state
 * Updates only the necessary DOM elements instead of full re-render
 * @param {Event} event - Click event from selector option
 */
function handlePlanSelection(event) {
  const option = event.currentTarget;
  const planId = option.dataset.planId;

  if (!planId) return;

  // Update selected plan
  appState.ui.myPlanPage.selectedPlanId = planId;

  // Update only the changed elements instead of full re-render
  updatePlanDisplay();

  // Close all selectors using the global service (same as config selectors)
  selectorService.closeAll();

  // Save state
  persistenceService.saveState();
}

/**
 * Update plan display without full re-render
 * Updates selector, duration, and plan information inline
 */
function updatePlanDisplay() {
  const { selectedPlanId } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  if (!plans || plans.length === 0) return;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  if (!selectedPlan) return;

  // Update selector summary text
  const summary = document.querySelector("#current-plan-selector summary .item-main-line");
  if (summary) {
    const weeksText = selectedPlan.totalWeeks === 1 ? "Week" : "Weeks";
    summary.innerHTML = `<span class="text-on-surface-medium">${selectedPlan.name}:&nbsp;</span><span class="data-highlight text-plan">${selectedPlan.totalWeeks} ${weeksText}</span>`;
  }

  // Update selector dropdown options list
  const optionsList = document.querySelector("#current-plan-selector .options-list");
  if (optionsList) {
    // Regenerate options HTML (all plans except currently selected)
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

    optionsList.innerHTML = optionsHtml;

    // Re-wire event listeners for new options
    const options = optionsList.querySelectorAll(".plan-selector-option");
    options.forEach((option) => {
      option.addEventListener("click", handlePlanSelection);
    });
  }

  // Update duration section
  const totalWeeks = selectedPlan.totalWeeks || 15;
  const remainingWeeks = selectedPlan.totalWeeks || 15;
  const totalWeeksText = totalWeeks === 1 ? "Week" : "Weeks";
  const remainingWeeksText = remainingWeeks === 1 ? "Week" : "Weeks";

  const durationLines = document.querySelectorAll(".plan-duration-line");
  if (durationLines.length >= 2) {
    durationLines[0].innerHTML = `<span class="text-on-surface-medium">Total Duration:&nbsp;</span><span class="data-highlight text-plan">${totalWeeks} ${totalWeeksText}</span>`;
    durationLines[1].innerHTML = `<span class="text-on-surface-medium">Remaining Duration:&nbsp;</span><span class="data-highlight text-plan">${remainingWeeks} ${remainingWeeksText}</span>`;
  }

  // Update phase chart
  updatePhaseChart(selectedPlan);

  // Update plan information
  const programInfoContent = document.querySelector(".plan-info-content");
  if (programInfoContent) {
    programInfoContent.textContent = selectedPlan.planInformation || "Information...";
  }
}

/**
 * Update phase chart display
 * Regenerates phase lines based on selected plan
 * @param {object} selectedPlan - The currently selected plan object
 */
function updatePhaseChart(selectedPlan) {
  const phaseChartContainer = document.querySelector(".phase-chart-container");
  if (!phaseChartContainer) return;

  const phases = selectedPlan.phases || {};
  const equipmentWeeks = selectedPlan.equipmentWeeks || {};
  const weekRanges = Object.keys(phases);

  if (weekRanges.length === 0) {
    phaseChartContainer.innerHTML = "";
    return;
  }

  // Parse and sort week ranges (4-week groups before 3-week groups)
  const sortedRanges = weekRanges.sort((a, b) => {
    const matchA = a.match(/week(\d+)-(\d+)/);
    const matchB = b.match(/week(\d+)-(\d+)/);

    if (!matchA || !matchB) return 0;

    const startA = parseInt(matchA[1], 10);
    const endA = parseInt(matchA[2], 10);
    const startB = parseInt(matchB[1], 10);
    const endB = parseInt(matchB[2], 10);

    // Sort by start week first
    if (startA !== startB) {
      return startA - startB;
    }

    // Longer ranges first when start is same
    return endB - endA;
  });

  // Generate phase lines HTML
  const phaseLinesHtml = sortedRanges.map((weekRange) => {
    const phaseName = phases[weekRange];
    const equipment = equipmentWeeks[weekRange] || "";

    const match = weekRange.match(/week(\d+)-(\d+)/);
    if (!match) return "";

    const start = match[1];
    const end = match[2];
    const displayRange = `Week ${start}-${end}:`;

    return `<div class="phase-week-line">
      <span class="text-on-surface-medium">${displayRange}&nbsp;</span><span class="text-plan">${phaseName}</span><span class="text-on-surface-medium">&nbsp;-&nbsp;</span><span class="text-plan">${equipment}</span>
    </div>`;
  }).join("");

  phaseChartContainer.innerHTML = phaseLinesHtml;
}
