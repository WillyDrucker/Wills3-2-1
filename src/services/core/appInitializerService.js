/* ==========================================================================
   APP INITIALIZER SERVICE - Application Bootstrap

   Orchestrates application startup: loads exercises, initializes services,
   restores state from localStorage, and handles reset logic. Single entry
   point for all initialization logic.

   Startup sequence:
   1. Initialize timer, modal, fullscreen, clock, and action services
   2. Fetch exercise data from API
   3. Build weekly plan
   4. Load saved state from localStorage
   5. Handle midnight reset if needed (via persistenceService flag)
   6. Resume active timers if state was restored
   7. Initialize wake lock and event listeners
   8. Trigger glow animations

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

function initializeTimerService(dependencies) {
  timerService.initialize({
    renderAll: dependencies.renderAll,
    renderActiveExerciseCard: dependencies.renderActiveExerciseCard,
    renderConfigHeaderLine: dependencies.renderConfigHeaderLine,
  });
}

function resetSessionAndLogs() {
  if (appState.rest.normal.timerId) clearInterval(appState.rest.normal.timerId);
  if (appState.rest.superset.left.timerId)
    clearInterval(appState.rest.superset.left.timerId);
  if (appState.rest.superset.right.timerId)
    clearInterval(appState.rest.superset.right.timerId);

  const currentPage = appState.ui.currentPage;
  const today = appState.todayDayName;
  const allExercises = appState.allExercises;
  const weeklyPlan = appState.weeklyPlan;
  const isApiReady = appState.ui.videoPlayer.isApiReady;
  const userHistory = appState.user.history;
  const authState = appState.auth;

  const initialAppState = getInitialAppState();

  Object.assign(appState, initialAppState);

  appState.todayDayName = today;
  appState.allExercises = allExercises;
  appState.weeklyPlan = weeklyPlan;
  appState.ui.currentPage = currentPage;
  appState.ui.videoPlayer.isApiReady = isApiReady;
  appState.user.history = userHistory;
  appState.auth = authState;
  appState.session.currentDayName = today;

  this.updateActiveWorkoutAndLog();
}

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

  const loadedState = persistenceService.loadState();

  if (loadedState && loadedState.needsReset) {
    if (loadedState.user) appState.user = loadedState.user;
    if (loadedState.auth) appState.auth = loadedState.auth;
    if (loadedState.ui && loadedState.ui.currentPage) {
      appState.ui.currentPage = loadedState.ui.currentPage;
    }
    boundReset();
  } else if (loadedState) {
    if (loadedState.session) appState.session = loadedState.session;
    if (loadedState.superset) appState.superset = loadedState.superset;
    if (loadedState.partner) appState.partner = loadedState.partner;
    if (loadedState.rest) appState.rest = loadedState.rest;
    if (loadedState.user) appState.user = loadedState.user;
    if (loadedState.auth) appState.auth = loadedState.auth;
    if (loadedState.ui && loadedState.ui.currentPage) {
      appState.ui.currentPage = loadedState.ui.currentPage;
    }

    // Force initial page: authenticated users → home, guest users → workout
    if (appState.auth?.isAuthenticated) {
      appState.ui.currentPage = "home";
    } else if (appState.auth?.isGuest) {
      appState.ui.currentPage = "workout";
    }

    // Set timer color: today = green (text-plan), other days = olive (text-deviation)
    if (appState.session.currentDayName) {
      appState.session.currentTimerColorClass =
        appState.session.currentDayName === appState.todayDayName ? "text-plan" : "text-deviation";
    }

    resumeTimersFromState();
    renderAll();

    // Force layout completion to prevent deferred work blocking first interaction
    document.body.offsetHeight;
  } else {
    appState.session.currentDayName = appState.todayDayName;
    appState.session.currentTimerColorClass = "text-plan";
    updateActiveWorkoutAndLog();
  }

  requestAnimationFrame(() => {
    document.body.classList.add("start-glow-animations");
  });

  initializeActiveCardEventListeners();
  initializeWakeLock();
}

