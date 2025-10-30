/* ==========================================================================
   MY DATA - Business Logic

   Handles My Data page interactions: tab changes, week navigation, admin
   Clear Today's Data button. Loads workout history from database on every
   render for real-time display of latest data.

   Architecture: Database-first rendering
   - Every render loads workouts from Supabase (source of truth)
   - Admin feature: Clear Today's Data for willy.drucker@gmail.com
   - Silent deletion: No browser prompts, missing workouts confirm deletion
   - Week offset management: Prevents navigation below 0 (current week)

   🔒 CEMENT: Week navigation wiring
   - Direct event listeners for calendar week buttons (no data-action attributes)
   - Prevents duplicate event handling (no action delegation)
   - Prevents week offset going below 0 (current week)
   - Uses class selectors (.week-nav-prev, .week-nav-next) for direct targeting

   Dependencies: appState, ui, getMyDataPageTemplate, persistenceService,
                 workoutSyncService
   Used by: actionService (myData actions)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getMyDataPageTemplate } from "./my-data.template.js";
import * as persistenceService from "services/core/persistenceService.js";
import { loadWorkoutsFromDatabase, clearTodaysWorkouts } from "services/data/workoutSyncService.js";

/* === RESULTS ALIGNMENT UTILITY === */
/**
 * Aligns workout results text within each exercise group for columnar alignment
 * Measures each column (weight, unit, x, reps, unit) and applies synchronized widths
 * per-exercise using CSS custom properties
 *
 * Architecture:
 * - Each .history-exercise-block is measured independently
 * - Grid columns align within the exercise group only (not globally)
 * - Handles edge cases: skipped sets, dumbbell suffix, variable digit counts
 * - Uses requestAnimationFrame to ensure DOM measurements are accurate
 */
function alignExerciseResults() {
  // Find all exercise blocks in the current view
  const exerciseBlocks = document.querySelectorAll('.history-exercise-block');

  if (exerciseBlocks.length === 0) return;

  exerciseBlocks.forEach(block => {
    // Find all results containers within this exercise (excludes skipped sets)
    const containers = block.querySelectorAll('.history-results-container');

    if (containers.length === 0) return;

    // Initialize max widths for each column in this exercise
    const maxWidths = {
      weight: 0,   // First value (e.g., "245")
      unit1: 0,    // Weight unit (e.g., " lbs")
      x: 0,        // Separator (e.g., " x ")
      reps: 0,     // Second value (e.g., "10")
      unit2: 0     // Reps unit (e.g., " reps" or " reps (ea.)")
    };

    // Measure each container to find max column widths
    containers.forEach(container => {
      const children = container.children;

      // Guard against unexpected DOM structure
      if (children.length < 5) return;

      // Measure each column (offsetWidth includes padding/border)
      maxWidths.weight = Math.max(maxWidths.weight, children[0]?.offsetWidth || 0);
      maxWidths.unit1 = Math.max(maxWidths.unit1, children[1]?.offsetWidth || 0);
      maxWidths.x = Math.max(maxWidths.x, children[2]?.offsetWidth || 0);
      maxWidths.reps = Math.max(maxWidths.reps, children[3]?.offsetWidth || 0);
      maxWidths.unit2 = Math.max(maxWidths.unit2, children[4]?.offsetWidth || 0);
    });

    // Apply synchronized column widths to this exercise block only
    // CSS variables are scoped to the block, so each exercise has independent alignment
    block.style.setProperty('--result-weight-width', `${maxWidths.weight}px`);
    block.style.setProperty('--result-unit1-width', `${maxWidths.unit1}px`);
    block.style.setProperty('--result-x-width', `${maxWidths.x}px`);
    block.style.setProperty('--result-reps-width', `${maxWidths.reps}px`);
    block.style.setProperty('--result-unit2-width', `${maxWidths.unit2}px`);
  });
}

export function handleHistoryTabChange(newTab) {
  if (appState.ui.myDataPage.selectedTab === newTab) return;
  appState.ui.myDataPage.selectedTab = newTab;
  renderMyDataPage();
}

export function handlePreviousWeek() {
  appState.ui.myDataPage.weekOffset++;
  renderMyDataPage();
}

export function handleNextWeek() {
  if (appState.ui.myDataPage.weekOffset <= 0) return;
  appState.ui.myDataPage.weekOffset--;
  renderMyDataPage();
}

export async function handleClearDailyData() {
  const result = await clearTodaysWorkouts();

  if (result.success) {
    // Silently refresh the page - deletion confirmed by missing workouts
    renderMyDataPage();
  } else {
    // Log error to console only (no browser prompts)
    console.error(`Error clearing daily data: ${result.error}`);
  }
}

export function refreshMyDataPageDisplay() {
  // Preserve scroll position before re-rendering (page-level scroll)
  const savedScrollPosition = document.documentElement.scrollTop || document.body.scrollTop || 0;

  // Re-render template without reloading from database (fast, for selector interactions)
  ui.mainContent.innerHTML = getMyDataPageTemplate();

  /* 🔒 CEMENT: Direct week navigation wiring (no reliance on external delegates) */
  const container = ui.mainContent;
  const prevButton = container.querySelector('.week-nav-prev');
  const nextButton = container.querySelector('.week-nav-next');

  if (prevButton) prevButton.addEventListener('click', handlePreviousWeek);
  if (nextButton) nextButton.addEventListener('click', handleNextWeek);

  // Admin-only: Wire up Clear Daily Data button
  const clearButton = container.querySelector('.clear-daily-data-button');
  if (clearButton) {
    clearButton.addEventListener('click', handleClearDailyData);
  }

  // Add click-outside-to-close listener for active workout selectors
  setupOutsideClickListener();

  // Restore scroll position after browser completes layout (requestAnimationFrame ensures timing)
  if (savedScrollPosition > 0) {
    requestAnimationFrame(() => {
      // Use window.scrollTo() which is more reliable than direct scrollTop assignment
      window.scrollTo(0, savedScrollPosition);
    });
  }

  // Apply results alignment after DOM is ready and layout is complete
  // Uses requestAnimationFrame to ensure accurate measurements
  requestAnimationFrame(() => {
    alignExerciseResults();
  });
}

export async function renderMyDataPage() {
  // Load workout history from database (slow, for initial load and data refresh)
  if (appState.auth?.isAuthenticated) {
    const { workouts } = await loadWorkoutsFromDatabase();
    appState.user.history.workouts = workouts;
  }

  ui.configSection.innerHTML = "";
  refreshMyDataPageDisplay();
  ui.workoutFooter.innerHTML = "";
}

// Click outside active selector to close it
function setupOutsideClickListener() {
  // Remove any existing listener first
  document.removeEventListener('click', handleOutsideClick);

  // Add new listener
  document.addEventListener('click', handleOutsideClick);
}

function handleOutsideClick(event) {
  // Only handle if there's an active selection
  if (!appState.ui.selectedHistoryWorkoutId) return;

  // Don't handle clicks when a modal is open (prevents interference with modal interactions)
  if (appState.ui.activeModal) return;

  // Check if click is outside all workout selectors
  const clickedSelector = event.target.closest('.workout-session-selector');

  // If clicked outside all selectors, close the active one
  if (!clickedSelector) {
    appState.ui.selectedHistoryWorkoutId = null;
    refreshMyDataPageDisplay();
  }
}
