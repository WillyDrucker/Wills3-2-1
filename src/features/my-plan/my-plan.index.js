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
import { renderActiveExerciseCard } from "../active-exercise-card/active-exercise-card.index.js";
import { renderPlanDisplay } from "../config-card/config-card.header.index.js";
import { getRepTarget } from "../../services/workout/repTargetService.js";
import {
  getCurrentWeekNumber,
  getRemainingWeeks,
  getCurrentWeekRange,
  getWeeksRemaining,
} from "../../shared/utils/planWeekUtils.js";
import {
  savePlanProgressToDatabase,
  updatePlanProgressStatus,
  loadWorkoutsFromDatabase,
} from "../../services/data/workoutSyncService.js";

/* === REP TARGET UPDATES === */

/**
 * Update rep targets for pending sets in workout log
 * Only updates pending sets, preserves completed sets
 */
function updatePendingSetRepTargets() {
  const newRepTarget = getRepTarget();

  appState.session.workoutLog.forEach((logEntry) => {
    if (logEntry.status === "pending") {
      logEntry.reps = newRepTarget;
    }
  });
}

/* === PAGE RENDERING === */

/**
 * Render My Plan page
 * Loads plan data if not already loaded, then renders template
 * Ensures "Will's 3-2-1" is always the default active plan
 */
export async function renderMyPlanPage() {
  // Load plans from JSON if not already loaded
  if (!appState.plan.plans || appState.plan.plans.length === 0) {
    const plans = await fetchPlans();
    if (plans) {
      appState.plan.plans = plans;
    }
  }

  // Ensure "Will's 3-2-1" is always the default active plan if no active plan exists
  if (!appState.ui.myPlanPage.activePlanId) {
    appState.ui.myPlanPage.activePlanId = "Will's 3-2-1";
    persistenceService.saveState();
  }

  // Initialize week tracking if active plan exists but week number doesn't (happens after nuke)
  if (appState.ui.myPlanPage.activePlanId && !appState.ui.myPlanPage.currentWeekNumber) {
    appState.ui.myPlanPage.currentWeekNumber = 1;
    const startDate = new Date().toISOString();
    appState.ui.myPlanPage.startDate = startDate;

    // Save initial plan progress to database
    const activePlan = appState.plan.plans.find(p => p.id === appState.ui.myPlanPage.activePlanId);
    if (activePlan && appState.auth?.isAuthenticated) {
      await savePlanProgressToDatabase({
        plan_id: appState.ui.myPlanPage.activePlanId,
        plan_duration_weeks: activePlan.totalWeeks,
        start_date: startDate,
        end_date: null,
        status: "active",
      });
    }

    persistenceService.saveState();
  }

  // Default to showing the active plan when page loads (only if no selection exists yet)
  if (!appState.ui.myPlanPage.selectedPlanId) {
    appState.ui.myPlanPage.selectedPlanId = appState.ui.myPlanPage.activePlanId;
  }

  // Initialize planHistory array if it doesn't exist
  if (!appState.ui.myPlanPage.planHistory) {
    appState.ui.myPlanPage.planHistory = [];
    persistenceService.saveState();
  }

  // Render template
  ui.mainContent.innerHTML = getMyPlanPageTemplate();

  // Wire up event listeners
  wireEventListeners();

  // Add animation classes after DOM is fully rendered (triggers CSS animations)
  // Double requestAnimationFrame ensures DOM is painted before adding classes
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateCurrentWeekHighlight();
    });
  });

  // Update config card plan display with newly initialized plan data
  renderPlanDisplay();
}

/* === EVENT LISTENERS === */

/**
 * Wire up event listeners for plan selection, confirmation, and week navigation
 * Handles plan selector option clicks, confirm button, and week nav buttons
 */
function wireEventListeners() {
  const selector = document.getElementById("current-plan-selector");
  if (!selector) return;

  // Plan selector option clicks
  const options = selector.querySelectorAll(".plan-selector-option");
  options.forEach((option) => {
    option.addEventListener("click", handlePlanSelection);
  });

  // Active Plan / Begin New Plan button
  // Uses data-action="openBeginNewPlanModal" to trigger modal via action handler system
  // No direct event listener needed - handled by global action dispatcher

  // Week navigation buttons
  const weekPrevButton = document.querySelector(".plan-week-navigator .week-nav-prev");
  const weekNextButton = document.querySelector(".plan-week-navigator .week-nav-next");

  if (weekPrevButton) {
    weekPrevButton.addEventListener("click", handleWeekPrevious);
  }

  if (weekNextButton) {
    weekNextButton.addEventListener("click", handleWeekNext);
  }
}

/* === EVENT HANDLERS === */

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

  // Don't reset confirmation data - it persists per plan
  // Button will automatically show correct state based on confirmedPlanId

  // Update only the changed elements instead of full re-render
  updatePlanDisplay();

  // Close all selectors using the global service (same as config selectors)
  selectorService.closeAll();

  // Save state
  persistenceService.saveState();
}

/**
 * Handle Change Plan button click
 * Archives current active plan to history, sets selected plan as new active plan
 * Initializes week tracking to Week 1 with today's date
 * Exported for use by Begin New Plan modal confirmation
 */
export async function handleChangePlan() {
  const { selectedPlanId, activePlanId, startDate, currentWeekNumber } = appState.ui.myPlanPage;

  if (!selectedPlanId) return;

  const newStartDate = new Date().toISOString();
  const endDate = new Date().toISOString();

  // Update previous plan status in database if it has displayable body parts, or delete if blank
  if (activePlanId && activePlanId !== selectedPlanId && startDate) {
    // Check if previous plan has any body parts that would display (completed sets within plan date range)
    const { workouts } = await loadWorkoutsFromDatabase();
    const previousPlanStartDate = new Date(startDate);

    // Normalize plan names for comparison (remove trailing colons)
    const normalizedActivePlanId = activePlanId.replace(/:$/, '');

    // Check if any workout has completed sets that would show as body parts in the plan span selector
    const hasDisplayableBodyParts = workouts.some(workout => {
      const normalizedWorkoutPlan = (workout.planName || '').replace(/:$/, '');

      // Must match plan name (don't filter by date - historical workouts should count)
      if (normalizedWorkoutPlan !== normalizedActivePlanId) return false;

      // Must have at least one completed set (not just logged, but completed)
      if (!workout.logs || workout.logs.length === 0) return false;
      return workout.logs.some(log => log.status === 'completed');
    });

    if (hasDisplayableBodyParts) {
      // Update status to "switched" in database
      await updatePlanProgressStatus(activePlanId, startDate, "switched", endDate);

      // Archive to local history
      const historyEntry = {
        planId: activePlanId,
        startDate: startDate,
        endDate: endDate,
        completedWeeks: currentWeekNumber ? [currentWeekNumber] : [],
        reason: "switched",
      };
      appState.ui.myPlanPage.planHistory.push(historyEntry);
    } else {
      // No logged workouts - delete the plan_progress entry to clean up
      const { deletePlanProgress } = await import("services/data/workoutSyncService.save.js");

      // Find the plan_progress entry to delete
      const { planProgress } = appState.user.history;
      const planProgressEntry = planProgress.find(pp => {
        // Normalize plan IDs for comparison
        const normalizedPpPlanId = pp.plan_id.replace(/:$/, '');
        const normalizedActivePlanId = activePlanId.replace(/:$/, '');

        // Compare dates as timestamps (handles format differences like Z vs +00:00)
        const ppDate = new Date(pp.start_date).getTime();
        const stateDate = new Date(startDate).getTime();

        return normalizedPpPlanId === normalizedActivePlanId &&
               ppDate === stateDate &&
               pp.status === 'active';
      });

      if (planProgressEntry) {
        await deletePlanProgress(planProgressEntry.id);

        // Reload plan progress to update state
        const { loadPlanProgressFromDatabase } = await import("services/data/workoutSyncService.load.js");
        const { planProgress: updatedPlanProgress } = await loadPlanProgressFromDatabase();
        appState.user.history.planProgress = updatedPlanProgress;
      }
    }
  }

  // Set selected plan as new active plan
  appState.ui.myPlanPage.activePlanId = selectedPlanId;

  // Set start date to today
  appState.ui.myPlanPage.startDate = newStartDate;

  // Initialize week tracking to Week 1
  appState.ui.myPlanPage.currentWeekNumber = 1;

  // Get plan duration for database entry
  const selectedPlan = appState.plan.plans.find(p => p.id === selectedPlanId);
  const planDurationWeeks = selectedPlan ? selectedPlan.totalWeeks : 15;

  // Save new active plan to database
  await savePlanProgressToDatabase({
    plan_id: selectedPlanId,
    plan_duration_weeks: planDurationWeeks,
    start_date: newStartDate,
    end_date: null,
    status: "active",
  });

  // Update button state
  const button = document.getElementById("plan-action-button");
  if (button) {
    button.textContent = "Active Plan";
    button.disabled = true;
  }

  // Update week display
  const weekRangeText = document.querySelector(".plan-week-navigator .week-range-text");
  if (weekRangeText) {
    weekRangeText.textContent = "Week 1";
  }

  // Update green borders and animation after changing to new plan
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateCurrentWeekHighlight();
    });
  });

  // Update Active Plan selector with new active plan (real-time)
  updateActivePlanSelector();

  // Update Remaining Duration display (real-time)
  updateRemainingDuration();

  // Update rep targets for pending sets (plan change resets to Week 1 reps)
  updatePendingSetRepTargets();

  // Update config card plan display to reflect new active plan
  renderPlanDisplay();

  // Re-render home page if currently viewing it
  if (appState.ui.currentPage === "home") {
    renderActiveExerciseCard();
  }

  // Save state
  persistenceService.saveState();
}

/**
 * Handle week previous button click
 * Auto-activates plan if not already active, then decrements week number
 */
function handleWeekPrevious() {
  const { currentWeekNumber, selectedPlanId, activePlanId } = appState.ui.myPlanPage;

  // If this plan isn't active yet, initialize it at Week 1 first
  if (activePlanId !== selectedPlanId) {
    appState.ui.myPlanPage.startDate = new Date().toISOString();
    appState.ui.myPlanPage.currentWeekNumber = 1;
    appState.ui.myPlanPage.activePlanId = selectedPlanId;
    persistenceService.saveState();
    updatePlanDisplay();
    return; // Don't decrement on first click, just initialize
  }

  const week = appState.ui.myPlanPage.currentWeekNumber || 1;
  if (week <= 1) return;

  // Decrement week number
  appState.ui.myPlanPage.currentWeekNumber = week - 1;

  // Update week display and navigation buttons (but don't regenerate phase chart)
  const weekRangeText = document.querySelector(".plan-week-navigator .week-range-text");
  if (weekRangeText) {
    weekRangeText.textContent = `Week ${appState.ui.myPlanPage.currentWeekNumber}`;
  }

  const { plans } = appState.plan;
  const selectedPlan = plans.find((p) => p.id === appState.ui.myPlanPage.selectedPlanId);
  const maxWeek = selectedPlan?.totalWeeks || 15;

  const prevButton = document.querySelector(".plan-week-navigator .week-nav-prev");
  const nextButton = document.querySelector(".plan-week-navigator .week-nav-next");

  if (prevButton) {
    prevButton.disabled = appState.ui.myPlanPage.currentWeekNumber <= 1;
  }
  if (nextButton) {
    nextButton.disabled = appState.ui.myPlanPage.currentWeekNumber >= maxWeek;
  }

  // Update green borders without regenerating HTML
  updateCurrentWeekHighlight();

  // Update Active Plan selector with new remaining weeks (real-time)
  updateActivePlanSelector();

  // Update Remaining Duration display (real-time)
  updateRemainingDuration();

  // Update rep targets for pending sets (week change affects all future sets)
  updatePendingSetRepTargets();

  // Update config card plan display to reflect new week
  renderPlanDisplay();

  // Re-render home page if currently viewing it
  if (appState.ui.currentPage === "home") {
    renderActiveExerciseCard();
  }

  // Save state
  persistenceService.saveState();
}

/**
 * Handle week next button click
 * Auto-activates plan if not already active, then increments week number
 */
function handleWeekNext() {
  const { selectedPlanId, currentWeekNumber, activePlanId } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  // If this plan isn't active yet, initialize it at Week 1 first
  if (activePlanId !== selectedPlanId) {
    appState.ui.myPlanPage.startDate = new Date().toISOString();
    appState.ui.myPlanPage.currentWeekNumber = 1;
    appState.ui.myPlanPage.activePlanId = selectedPlanId;
    persistenceService.saveState();
    updatePlanDisplay();
    return; // Show Week 1 first, next click will advance
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const maxWeek = selectedPlan?.totalWeeks || 15;

  const week = appState.ui.myPlanPage.currentWeekNumber || 1;
  if (week >= maxWeek) return;

  // Increment week number
  appState.ui.myPlanPage.currentWeekNumber = week + 1;

  // Update week display and navigation buttons (but don't regenerate phase chart)
  const weekRangeText = document.querySelector(".plan-week-navigator .week-range-text");
  if (weekRangeText) {
    weekRangeText.textContent = `Week ${appState.ui.myPlanPage.currentWeekNumber}`;
  }

  const prevButton = document.querySelector(".plan-week-navigator .week-nav-prev");
  const nextButton = document.querySelector(".plan-week-navigator .week-nav-next");

  if (prevButton) {
    prevButton.disabled = appState.ui.myPlanPage.currentWeekNumber <= 1;
  }
  if (nextButton) {
    nextButton.disabled = appState.ui.myPlanPage.currentWeekNumber >= maxWeek;
  }

  // Update green borders without regenerating HTML
  updateCurrentWeekHighlight();

  // Update Active Plan selector with new remaining weeks (real-time)
  updateActivePlanSelector();

  // Update Remaining Duration display (real-time)
  updateRemainingDuration();

  // Update rep targets for pending sets (week change affects all future sets)
  updatePendingSetRepTargets();

  // Update config card plan display to reflect new week
  renderPlanDisplay();

  // Re-render home page if currently viewing it
  if (appState.ui.currentPage === "home") {
    renderActiveExerciseCard();
  }

  // Save state
  persistenceService.saveState();
}

/* === DISPLAY UPDATES === */

/**
 * Update Active Plan selector in real-time
 * Updates display to "Week # of #: plan_name" format without full re-render
 * Color: Week numbers in green, "of" and plan name in white
 */
function updateActivePlanSelector() {
  const { activePlanId, currentWeekNumber } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  const activePlanSummary = document.querySelector("#active-plan-selector summary .item-main-line");
  if (activePlanSummary && activePlanId && plans) {
    const activePlan = plans.find((p) => p.id === activePlanId);
    if (activePlan) {
      const currentWeek = currentWeekNumber || 1;
      const totalWeeks = activePlan.totalWeeks;

      activePlanSummary.innerHTML = `<span class="text-plan">Week ${currentWeek}</span> of <span class="text-plan">${totalWeeks}</span>: ${activePlan.name}`;
    }
  }
}

/**
 * Update Remaining Duration display in real-time
 * Updates only the remaining weeks line without full re-render
 * Uses manual week tracking (currentWeekNumber) not calendar calculation
 */
function updateRemainingDuration() {
  const { activePlanId, currentWeekNumber, selectedPlanId } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  // Only update if we're viewing the active plan
  if (!plans || activePlanId !== selectedPlanId) return;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  if (!selectedPlan) return;

  // Use getWeeksRemaining (manual week tracking) not getRemainingWeeks (calendar-based)
  const remainingWeeks = currentWeekNumber
    ? getWeeksRemaining(activePlanId, currentWeekNumber, plans) || selectedPlan.totalWeeks
    : selectedPlan.totalWeeks;
  const remainingWeeksText = remainingWeeks === 1 ? "Week" : "Weeks";

  // Update only the second duration line (Remaining Duration)
  const durationLines = document.querySelectorAll(".plan-duration-line");
  if (durationLines.length >= 2) {
    durationLines[1].innerHTML = `<span class="text-on-surface-medium">Remaining Duration:&nbsp;</span><span class="data-highlight text-plan">${remainingWeeks} ${remainingWeeksText}</span>`;
  }
}

/**
 * Update plan display without full re-render
 * Updates selector, duration, and plan information inline
 */
function updatePlanDisplay() {
  const { selectedPlanId, activePlanId, currentWeekNumber } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  if (!plans || plans.length === 0) return;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  if (!selectedPlan) return;

  const isActivePlan = activePlanId === selectedPlanId;

  // Update Current Plan selector summary text (always shows total weeks)
  const summary = document.querySelector("#current-plan-selector summary .item-main-line");
  if (summary) {
    // Always show total weeks (not remaining)
    const weeksToShow = selectedPlan.totalWeeks;
    const weeksText = weeksToShow === 1 ? "Week" : "Weeks";
    summary.innerHTML = `<span class="text-on-surface-medium">${selectedPlan.name}:&nbsp;</span><span class="data-highlight text-plan">${weeksToShow} ${weeksText}</span>`;
  }

  // Update Active Plan selector (shows "Week # of #: plan_name" format)
  const activePlanSummary = document.querySelector("#active-plan-selector summary .item-main-line");
  if (activePlanSummary && activePlanId) {
    const activePlan = plans.find((p) => p.id === activePlanId);
    if (activePlan) {
      const currentWeek = currentWeekNumber || 1;
      const totalWeeks = activePlan.totalWeeks;

      activePlanSummary.innerHTML = `<span class="text-plan">Week ${currentWeek}</span> of <span class="text-plan">${totalWeeks}</span>: ${activePlan.name}`;
    }
  }

  // Update selector dropdown options list
  const optionsList = document.querySelector("#current-plan-selector .options-list");
  if (optionsList) {
    // Regenerate options HTML (all plans except currently selected - always show total weeks)
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

    optionsList.innerHTML = optionsHtml;

    // Re-wire event listeners for new options
    const options = optionsList.querySelectorAll(".plan-selector-option");
    options.forEach((option) => {
      option.addEventListener("click", handlePlanSelection);
    });
  }

  // Update week navigation if this plan is active
  const { startDate } = appState.ui.myPlanPage;

  if (isActivePlan && currentWeekNumber) {
    const weekText = `Week ${currentWeekNumber}`;
    const weekRangeText = document.querySelector(".plan-week-navigator .week-range-text");
    if (weekRangeText) {
      weekRangeText.textContent = weekText;
    }

    // Update button disabled states
    const prevButton = document.querySelector(".plan-week-navigator .week-nav-prev");
    const nextButton = document.querySelector(".plan-week-navigator .week-nav-next");
    const maxWeek = selectedPlan.totalWeeks || 15;

    if (prevButton) {
      prevButton.disabled = currentWeekNumber <= 1;
    }

    if (nextButton) {
      nextButton.disabled = currentWeekNumber >= maxWeek;
    }
  }

  // Update duration section
  const totalWeeks = selectedPlan.totalWeeks || 15;
  const remainingWeeks = startDate && isActivePlan
    ? getRemainingWeeks(startDate, totalWeeks)
    : totalWeeks;
  const totalWeeksText = totalWeeks === 1 ? "Week" : "Weeks";
  const remainingWeeksText = remainingWeeks === 1 ? "Week" : "Weeks";

  const durationLines = document.querySelectorAll(".plan-duration-line");
  if (durationLines.length >= 2) {
    durationLines[0].innerHTML = `<span class="text-on-surface-medium">Total Duration:&nbsp;</span><span class="data-highlight text-plan">${totalWeeks} ${totalWeeksText}</span>`;
    durationLines[1].innerHTML = `<span class="text-on-surface-medium">Remaining Duration:&nbsp;</span><span class="data-highlight text-plan">${remainingWeeks} ${remainingWeeksText}</span>`;
  }

  // Update phase chart
  updatePhaseChart(selectedPlan);

  // Add animation classes after DOM update
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateCurrentWeekHighlight();
    });
  });

  // Update plan information
  const programInfoContent = document.querySelector(".plan-info-content");
  if (programInfoContent) {
    programInfoContent.textContent = selectedPlan.planInformation || "Information...";
  }

  // Update button state (Active Plan vs Begin New Plan)
  const button = document.getElementById("plan-action-button");
  if (button) {
    const buttonText = isActivePlan ? "Active Plan" : "Begin New Plan";
    button.textContent = buttonText;
    button.disabled = isActivePlan;
  }
}

/* === WEEK HIGHLIGHTING === */

/**
 * Update green borders and animation for current and completed week ranges
 * - Completed weeks (before current): Solid green border
 * - Current week: Pulsing green glow animation
 */
function updateCurrentWeekHighlight() {
  const { selectedPlanId, currentWeekNumber, activePlanId } = appState.ui.myPlanPage;
  const { plans } = appState.plan;

  if (!plans || plans.length === 0) return;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  if (!selectedPlan) return;

  const phases = selectedPlan.phases || {};
  const isActivePlan = activePlanId === selectedPlanId;

  // Determine which week range contains the current week
  const currentWeekRangeKey = isActivePlan && currentWeekNumber
    ? getCurrentWeekRange(phases, currentWeekNumber)
    : null;

  // Get all week range boxes
  const weekBoxes = document.querySelectorAll(".week-range-box");
  const weekRanges = Object.keys(phases).sort((a, b) => {
    const matchA = a.match(/week(\d+)-(\d+)/);
    const matchB = b.match(/week(\d+)-(\d+)/);
    if (!matchA || !matchB) return 0;
    const startA = parseInt(matchA[1], 10);
    const startB = parseInt(matchB[1], 10);
    if (startA !== startB) return startA - startB;
    return parseInt(matchB[2], 10) - parseInt(matchA[2], 10);
  });

  // Find the index of the current week range
  let currentWeekRangeIndex = -1;
  if (currentWeekRangeKey) {
    currentWeekRangeIndex = weekRanges.indexOf(currentWeekRangeKey);
  }

  // Apply classes:
  // - is-completed: Solid green border for completed weeks (before current)
  // - is-current-week: Pulsing green glow for current week
  weekBoxes.forEach((box, index) => {
    // Remove both classes first
    box.classList.remove("is-completed", "is-current-week");

    if (currentWeekRangeIndex >= 0) {
      if (index < currentWeekRangeIndex) {
        // Completed weeks: solid green border
        box.classList.add("is-completed");
      } else if (index === currentWeekRangeIndex) {
        // Current week: pulsing green glow
        box.classList.add("is-current-week");
      }
    }
  });
}

/* === PHASE CHART UPDATES === */

/**
 * Update weekly guide boxes display
 * Regenerates 50px boxes for each week range based on selected plan
 * @param {object} selectedPlan - The currently selected plan object
 */
function updatePhaseChart(selectedPlan) {
  const weekRangeContainer = document.querySelector(".week-range-container");
  if (!weekRangeContainer) return;

  const phases = selectedPlan.phases || {};
  const equipmentWeeks = selectedPlan.equipmentWeeks || {};
  const weeklyReps = selectedPlan.weeklyReps || {};
  const weekRanges = Object.keys(phases);

  if (weekRanges.length === 0) {
    weekRangeContainer.innerHTML = "";
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

  // Generate weekly guide boxes HTML (status classes added after render)
  const weekRangeBoxesHtml = sortedRanges.map((weekRange, index) => {
    const phaseName = phases[weekRange];
    const equipment = equipmentWeeks[weekRange] || "";

    const match = weekRange.match(/week(\d+)-(\d+)/);
    if (!match) return "";

    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);

    // Calculate actual rep range from all weeks in the range
    const repValues = [];
    for (let week = start; week <= end; week++) {
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

    const displayRange = `Week ${start}-${end}`;

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

  weekRangeContainer.innerHTML = weekRangeBoxesHtml;
}
