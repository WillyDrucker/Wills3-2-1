/* ==========================================================================
   APP INITIALIZER SERVICE - Application Bootstrap

   Orchestrates application startup: loads exercises, initializes services,
   restores state from localStorage, and handles reset logic. Single entry
   point for all initialization logic.

   Startup sequence:
   1. Initialize timer, modal, fullscreen, clock, and action services
   2. Fetch exercise data from API
   3. Build weekly plan
   4. Load training plans from JSON (for config card and My Plan page)
   5. Load saved state from localStorage (including myPlanPage)
   6. Handle midnight reset if needed (via persistenceService flag)
   7. Resume active timers if state was restored
   8. Add glow animations class (before rendering)
   9. Initialize wake lock and event listeners
   10. Initialize automatic week advancement

   Dependencies: appState, workoutService, persistenceService, exerciseClient,
                 timerService, actionService, modalService, clockService,
                 fullscreen, wakeLock
   Used by: main.js (DOMContentLoaded)
   ========================================================================== */

import { appState, getInitialAppState } from "state";
import { getTodayDayName } from "utils";
import * as workoutService from "services/workout/workoutService.js";
import * as persistenceService from "services/core/persistenceService.js";
import { fetchExercises } from "api/exerciseClient.js";
import { fetchPlans } from "api/plansClient.js";
import * as timerService from "services/timer/timerService.js";
import { resumeTimersFromState } from "services/timer/timerResumptionService.js";
import { initializeWakeLock } from "lib/wakeLock.js";
import * as actionService from "services/actions/actionService.js";
import * as modalService from "services/ui/modalService.js";
import * as fullscreen from "lib/fullscreen.js";
import { renderSideNav } from "features/side-nav/side-nav.index.js";
import * as clockService from "services/ui/clockService.js";
import { renderActiveCardHeader } from "features/active-exercise-card/active-exercise-card.index.js";
import { renderConfigHeaderLine } from "features/config-card/config-card.header.index.js";
import { loadWorkoutsFromDatabase } from "services/data/workoutSyncService.js";
import { initializeDailyWeekCheck } from "services/core/weekAdvancementService.js";

/* === SERVICE INITIALIZATION === */

/**
 * Initialize timer service with render dependencies
 * @param {object} dependencies - Object containing render functions
 */
function initializeTimerService(dependencies) {
  timerService.initialize({
    renderAll: dependencies.renderAll,
    renderActiveExerciseCard: dependencies.renderActiveExerciseCard,
    renderConfigHeaderLine: dependencies.renderConfigHeaderLine,
  });
}

/* === SESSION RESET === */

/**
 * Reset session and logs while preserving essential state
 * Called on midnight reset or manual reset
 */
function resetSessionAndLogs() {
  if (appState.rest.normal.timerId) clearInterval(appState.rest.normal.timerId);
  if (appState.rest.superset.left.timerId)
    clearInterval(appState.rest.superset.left.timerId);
  if (appState.rest.superset.right.timerId)
    clearInterval(appState.rest.superset.right.timerId);

  // Preserve state that should survive reset
  const currentPage = appState.ui.currentPage;
  const today = appState.todayDayName;
  const allExercises = appState.allExercises;
  const weeklyPlan = appState.weeklyPlan;
  const isApiReady = appState.ui.videoPlayer.isApiReady;
  const userHistory = appState.user.history;
  const authState = appState.auth;
  const planData = appState.plan; // Loaded plans array (never reset)
  const myPlanPage = appState.ui.myPlanPage; // Active plan ID, current week, plan history

  const initialAppState = getInitialAppState();

  Object.assign(appState, initialAppState);

  appState.todayDayName = today;
  appState.allExercises = allExercises;
  appState.weeklyPlan = weeklyPlan;
  appState.ui.currentPage = currentPage;
  appState.ui.videoPlayer.isApiReady = isApiReady;
  appState.user.history = userHistory;
  appState.auth = authState;
  appState.plan = planData; // Restore plan data
  appState.ui.myPlanPage = myPlanPage; // Restore My Plan page state
  appState.session.currentDayName = today;

  this.updateActiveWorkoutAndLog();
}

/* === MAIN INITIALIZATION === */

/**
 * Main application initialization function
 * Orchestrates startup sequence: services, data loading, state restoration
 * @param {object} dependencies - Object containing render and update functions
 */
export async function initialize(dependencies) {
  const {
    renderAll,
    renderModalsOnly,
    updateActiveWorkoutAndLog,
    updateActiveWorkoutPreservingLogs,
    renderError,
    initializeActiveCardEventListeners,
  } = dependencies;

  const boundReset = resetSessionAndLogs.bind({ updateActiveWorkoutAndLog });

  initializeTimerService(dependencies);
  modalService.initialize(renderAll, renderModalsOnly);
  fullscreen.initialize(renderSideNav);
  clockService.initialize({ renderActiveCardHeader, renderConfigHeaderLine });

  // Initialize action service BEFORE rendering to prevent touch event delays
  actionService.initialize({
    renderAll,
    updateActiveWorkoutAndLog,
    updateActiveWorkoutPreservingLogs,
    resetSessionAndLogs: boundReset,
  });

  document.addEventListener(
    "fullscreenchange",
    fullscreen.handleFullScreenChange
  );
  document.addEventListener(
    "webkitfullscreenchange",
    fullscreen.handleFullScreenChange
  );

  appState.allExercises = await fetchExercises();
  if (!appState.allExercises) {
    renderError("Could not load workout data.");
    return;
  }
  appState.todayDayName = getTodayDayName();
  workoutService.buildWeeklyPlan();

  // Load training plans for config card and My Plan page
  const plans = await fetchPlans();
  if (plans) {
    appState.plan.plans = plans;
  } else {
    appState.plan.plans = [];
    console.warn('[AppInit] Failed to load plans, using empty array');
  }

  const loadedState = persistenceService.loadState();

  if (loadedState && loadedState.needsReset) {
    if (loadedState.user) appState.user = loadedState.user;
    if (loadedState.auth) appState.auth = loadedState.auth;
    if (loadedState.ui) {
      // Preserve UI state including currentPage, myPlanPage, and other UI settings
      if (loadedState.ui.currentPage) appState.ui.currentPage = loadedState.ui.currentPage;
      if (loadedState.ui.myPlanPage) appState.ui.myPlanPage = loadedState.ui.myPlanPage;
      if (loadedState.ui.isConfigHeaderExpanded !== undefined) {
        appState.ui.isConfigHeaderExpanded = loadedState.ui.isConfigHeaderExpanded;
      }
    }
    boundReset();
  } else if (loadedState) {
    if (loadedState.session) appState.session = loadedState.session;
    if (loadedState.superset) appState.superset = loadedState.superset;
    if (loadedState.partner) appState.partner = loadedState.partner;
    if (loadedState.rest) appState.rest = loadedState.rest;
    if (loadedState.user) appState.user = loadedState.user;
    if (loadedState.auth) appState.auth = loadedState.auth;
    if (loadedState.ui) {
      // Restore full UI state including currentPage, myPlanPage, and other UI settings
      if (loadedState.ui.currentPage) appState.ui.currentPage = loadedState.ui.currentPage;
      if (loadedState.ui.myPlanPage) appState.ui.myPlanPage = loadedState.ui.myPlanPage;
      if (loadedState.ui.isConfigHeaderExpanded !== undefined) {
        appState.ui.isConfigHeaderExpanded = loadedState.ui.isConfigHeaderExpanded;
      }
    }

    // Force initial page: authenticated users → home, guest users → workout
    if (appState.auth?.isAuthenticated) {
      appState.ui.currentPage = "home";

      // Load workout history from database for authenticated users
      // This populates appState.user.history.workouts for previous exercise results feature
      const { workouts, error } = await loadWorkoutsFromDatabase();
      if (!error && workouts) {
        appState.user.history.workouts = workouts;
        persistenceService.saveState();
      } else if (error) {
        console.error('[AppInit] Failed to load workouts from database:', error);
      }
    } else if (appState.auth?.isGuest) {
      appState.ui.currentPage = "workout";
    }

    // Set timer color: today = green (text-plan), other days = olive (text-deviation)
    if (appState.session.currentDayName) {
      appState.session.currentTimerColorClass =
        appState.session.currentDayName === appState.todayDayName ? "text-plan" : "text-deviation";
    }

    resumeTimersFromState();

    // Add glow animations class BEFORE rendering to ensure animations work on page load
    document.body.classList.add("start-glow-animations");

    renderAll();

    // Force layout completion to prevent deferred work blocking first interaction
    document.body.offsetHeight;
  } else {
    appState.session.currentDayName = appState.todayDayName;
    appState.session.currentTimerColorClass = "text-plan";

    // Add glow animations class BEFORE rendering to ensure animations work on page load
    document.body.classList.add("start-glow-animations");

    updateActiveWorkoutAndLog();
  }

  initializeActiveCardEventListeners();
  initializeWakeLock();

  // Initialize automatic week advancement (checks for Sunday transitions)
  initializeDailyWeekCheck();
}

