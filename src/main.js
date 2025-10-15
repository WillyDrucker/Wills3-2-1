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

  /* Minimal render preserves animations - update session display, active card, and workout log */
  setTimeout(() => {
    renderSessionDisplay();
    renderFocusDisplay();
    renderActiveExerciseCard(); // Update Current Exercise set count to reflect session changes
    renderWorkoutLog(); // Update Today's Workout to reflect session changes
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

/* Login-first authentication flow
 * 1. Check if user has existing session (Supabase session or guest mode)
 * 2. If not authenticated: Show login page
 * 3. If authenticated: Initialize at homepage, Guest: Initialize at workout page
 * 4. Listen for auth-success event to initialize app after login
 */
async function checkAuthAndInitialize() {
  // Check for existing Supabase session
  const { session } = await getSession();

  // If authenticated or guest mode, initialize app
  if (isAuthenticated() || isGuest()) {
    // Authenticated users → homepage, Guests → workout page (ignore saved page state)
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
    // Show login page
    renderLoginPage();
  }
}

// Listen for successful authentication (from login page)
window.addEventListener("auth-success", () => {
  // Authenticated users → homepage, Guests → workout page
  if (isAuthenticated()) {
    appState.ui.currentPage = "home";
  } else if (isGuest()) {
    appState.ui.currentPage = "workout"; // Forces workout page (not homepage, not saved state)
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

// Listen for auth state changes (logout, session expiry)
onAuthStateChange((user, session) => {
  // If user logs out, show login page
  if (!user && !isGuest()) {
    renderLoginPage();
  }
});

document.addEventListener("DOMContentLoaded", checkAuthAndInitialize);
