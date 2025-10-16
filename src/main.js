/* ==========================================================================
   MAIN - Application entry point and render orchestration

   Central render loop and core update functions. Coordinates all feature
   renderers and manages app initialization.

   Core functions:
   - updateActiveWorkoutAndLog: Full workout regeneration (mode switches)
   - updateActiveWorkoutPreservingLogs: Minimal update (session cycling)
   - renderAll: Main render loop - clears and re-renders entire UI
   - renderError: Displays top-level error messages

   Render function separation prevents animation restarts:
   - Mode switching uses updateActiveWorkoutAndLog (full re-render)
   - Session cycling uses updateActiveWorkoutPreservingLogs (minimal update)
   - Session cycling only updates display, never re-renders active card/log

   Dependencies: appState, ui, all services, all feature renderers
   Used by: DOMContentLoaded initialization, appInitializerService
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import * as workoutProgressionService from "services/workout/workoutProgressionService.js";
import * as workoutLogGenerationService from "services/workout/workoutLogGenerationService.js";
import * as workoutLogPreservationService from "services/workout/workoutLogPreservationService.js";
import { updateWorkoutTimeRemaining } from "services/workout/workoutService.js";
import * as scrollService from "services/ui/scrollService.js";
import * as persistenceService from "services/core/persistenceService.js";
import * as appInitializerService from "services/core/appInitializerService.js";

import { getSession, onAuthStateChange, isAuthenticated, isGuest } from "services/authService.js";
import { renderLoginPage } from "features/login-page/login-page.index.js";
import { renderProfilePage } from "features/profile-page/profile-page.index.js";
import { renderAppHeader } from "features/app-header/app-header.index.js";
import { renderHomePage } from "features/home-page/home-page.index.js";
import { renderMyDataPage } from "features/my-data/my-data.index.js";
import { renderSideNav } from "features/side-nav/side-nav.index.js";
import { renderResetConfirmationModal } from "features/reset-confirmation-modal/reset-confirmation-modal.index.js";
import { renderResetOptionsModal } from "features/reset-modal/reset-modal.index.js";
import { renderVideoPlayer } from "features/video-player/video-player.index.js";
import { renderSupersetModal } from "features/superset-modal/superset-modal.index.js";
import { renderPartnerModal } from "features/partner-modal/partner-modal.index.js";
import { renderWorkoutLog } from "features/workout-log/workout-log.index.js";
import { renderConfigHeader, renderConfigHeaderLine, renderSessionDisplay, renderFocusDisplay } from "features/config-card/config-card.header.index.js";
import { renderConfigModal } from "features/config-card/config-card.modal.index.js";
import {
  renderActiveExerciseCard,
  initializeActiveCardEventListeners,
} from "features/active-exercise-card/active-exercise-card.index.js";
import { renderWorkoutResultsCard } from "features/workout-results-card/workout-results-card.index.js";

function updateActiveWorkoutAndLog() {
  if (appState.partner.isActive) {
    appState.session.workoutLog =
      workoutLogGenerationService.generatePartnerWorkoutLog();
  } else if (appState.superset.isActive) {
    appState.session.workoutLog =
      workoutLogGenerationService.generateSupersetWorkoutLog();
  } else {
    appState.session.workoutLog = workoutLogGenerationService.generateWorkoutLog();
  }
  workoutProgressionService.recalculateCurrentStateAfterLogChange();
  renderAll();
  persistenceService.saveState();
}

function updateActiveWorkoutPreservingLogs() {
  if (appState.partner.isActive) {
    appState.session.workoutLog =
      workoutLogPreservationService.updatePartnerWorkoutLogForSessionChange(
        appState.session.workoutLog
      );
  } else if (appState.superset.isActive) {
    appState.session.workoutLog =
      workoutLogPreservationService.updateSupersetWorkoutLogForSessionChange(
        appState.session.workoutLog
      );
  } else {
    appState.session.workoutLog = workoutLogPreservationService.updateWorkoutLogForSessionChange(
      appState.session.workoutLog
    );
  }
  workoutProgressionService.recalculateCurrentStateAfterLogChange();
  updateWorkoutTimeRemaining();

  // Minimal render preserves animations
  setTimeout(() => {
    renderConfigHeader();
    renderSessionDisplay();
    renderFocusDisplay();
    renderActiveExerciseCard();
    renderWorkoutLog();
  }, 50);

  persistenceService.saveState();
}

function renderAll() {
  ui.configSection.innerHTML = "";
  ui.mainContent.innerHTML = "";
  ui.workoutFooter.innerHTML = "";
  renderAppHeader();
  if (appState.ui.currentPage === "home") {
    renderHomePage();
  } else if (appState.ui.currentPage === "myData") {
    renderMyDataPage();
  } else if (appState.ui.currentPage === "profile") {
    renderProfilePage();
  } else {
    updateWorkoutTimeRemaining();
    if (appState.session.isWorkoutComplete) {
      renderWorkoutResultsCard();
    } else {
      renderConfigHeader();
      renderActiveExerciseCard();
    }
    renderWorkoutLog();
  }
  renderSideNav();
  renderResetConfirmationModal();
  renderResetOptionsModal();
  renderSupersetModal();
  renderPartnerModal();
  renderConfigModal();
  renderVideoPlayer();
  if (appState.session.playCompletionAnimation) {
    appState.session.playCompletionAnimation = false;
  }
}

function renderError(message) {
  ui.mainContent.innerHTML = `<div class="card rest-day-container"><span class="rest-day-text text-skip">${message}</span></div>`;
  ui.configSection.innerHTML = "";
  ui.workoutFooter.innerHTML = "";
}

// Login-first: check existing session → initialize or show login
async function checkAuthAndInitialize() {
  const { session } = await getSession();

  if (isAuthenticated() || isGuest()) {
    // Authenticated → home, Guest → workout (ignore saved page)
    if (isAuthenticated()) {
      appState.ui.currentPage = "home";
    } else if (isGuest()) {
      appState.ui.currentPage = "workout";
    }

    appInitializerService.initialize({
      renderAll,
      updateActiveWorkoutAndLog,
      updateActiveWorkoutPreservingLogs,
      renderError,
      initializeActiveCardEventListeners,
      renderConfigHeader,
      renderConfigHeaderLine,
      renderActiveExerciseCard,
    });
  } else {
    renderLoginPage();
  }
}

window.addEventListener("auth-success", () => {
  // Authenticated → home, Guest → workout (force, not saved state)
  if (isAuthenticated()) {
    appState.ui.currentPage = "home";
  } else if (isGuest()) {
    appState.ui.currentPage = "workout";
  }

  appInitializerService.initialize({
    renderAll,
    updateActiveWorkoutAndLog,
    updateActiveWorkoutPreservingLogs,
    renderError,
    initializeActiveCardEventListeners,
    renderConfigHeader,
    renderConfigHeaderLine,
    renderActiveExerciseCard,
  });
});

onAuthStateChange((user, session) => {
  if (!user && !isGuest()) {
    renderLoginPage();
  }
});

document.addEventListener("DOMContentLoaded", checkAuthAndInitialize);
