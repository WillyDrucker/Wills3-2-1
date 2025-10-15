/* ==========================================================================
   APP INITIALIZER SERVICE - Application Bootstrap

   Orchestrates application startup: loads exercises, initializes services,
   restores state from localStorage, and handles reset logic. Single entry
   point for all initialization logic.

   🔒 CEMENT: Startup sequence
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

  const initialAppState = getInitialAppState();

  Object.assign(appState, initialAppState);

  appState.todayDayName = today;
  appState.allExercises = allExercises;
  appState.weeklyPlan = weeklyPlan;
  appState.ui.currentPage = currentPage;
  appState.ui.videoPlayer.isApiReady = isApiReady;
  appState.user.history = userHistory;
  appState.session.currentDayName = today;

  // 🔒 CEMENT: Initialize timer color based on today's workout type
  // Will be properly set after weeklyPlan is built

  this.updateActiveWorkoutAndLog(); // `this` will be bound from main.js
}

export async function initialize(dependencies) {
  const {
    renderAll,
    updateActiveWorkoutAndLog,
    updateActiveWorkoutPreservingLogs,
    renderError,
    initializeActiveCardEventListeners,
  } = dependencies;

  const boundReset = resetSessionAndLogs.bind({ updateActiveWorkoutAndLog });

  initializeTimerService(dependencies);
  modalService.initialize(renderAll);
  fullscreen.initialize(renderSideNav);
  clockService.initialize({ renderActiveCardHeader, renderConfigHeaderLine });
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

  // CEMENTED FIX: The initializer now handles the reset signal from the persistence service.
  if (loadedState && loadedState.needsReset) {
    if (loadedState.user) appState.user = loadedState.user;
    if (loadedState.ui && loadedState.ui.currentPage) {
      appState.ui.currentPage = loadedState.ui.currentPage;
    }
    boundReset(); // Call the single source of truth for resetting.
  } else if (loadedState) {
    if (loadedState.session) appState.session = loadedState.session;
    if (loadedState.superset) appState.superset = loadedState.superset;
    if (loadedState.partner) appState.partner = loadedState.partner;
    if (loadedState.rest) appState.rest = loadedState.rest;
    if (loadedState.user) appState.user = loadedState.user;
    if (loadedState.ui && loadedState.ui.currentPage) {
      appState.ui.currentPage = loadedState.ui.currentPage;
    }

    // 🔒 CEMENT: Force initial page based on auth state
    // Authenticated users → homepage
    // Guest users → workout page (ignore saved page state)
    if (appState.auth?.isAuthenticated) {
      appState.ui.currentPage = "home";
    } else if (appState.auth?.isGuest) {
      appState.ui.currentPage = "workout";
    }


    // 🔒 CEMENT: Set timer color after loading state
    // Today = green (text-plan), Any other day = olive (text-deviation)
    if (appState.session.currentDayName) {
      appState.session.currentTimerColorClass =
        appState.session.currentDayName === appState.todayDayName ? "text-plan" : "text-deviation";
    }

    resumeTimersFromState();
    renderAll();
  } else {
    appState.session.currentDayName = appState.todayDayName;
    // Today = green (text-plan)
    appState.session.currentTimerColorClass = "text-plan";
    updateActiveWorkoutAndLog();
  }

  requestAnimationFrame(() => {
    document.body.classList.add("start-glow-animations");
  });

  actionService.initialize({
    renderAll,
    updateActiveWorkoutAndLog,
    updateActiveWorkoutPreservingLogs,
    resetSessionAndLogs: boundReset,
  });

  initializeActiveCardEventListeners();
  initializeWakeLock();
}

