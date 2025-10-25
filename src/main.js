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
import { renderNewWorkoutModal } from "features/new-workout-modal/new-workout-modal.index.js";
import { renderEditWorkoutModal } from "features/edit-workout-modal/edit-workout-modal.index.js";
import { renderDeleteLogModal } from "features/delete-log-modal/delete-log-modal.index.js";
import { renderDeleteWorkoutModal } from "features/delete-workout-modal/delete-workout-modal.index.js";
import { renderCancelChangesModal } from "features/shared-modals/cancel-changes-modal.index.js";
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

  // Minimal render: Targeted updates preserve animations
  setTimeout(() => {
    renderSessionDisplay();
    renderFocusDisplay();
    renderActiveExerciseCard();
    renderWorkoutLog();
  }, 50);

  persistenceService.saveState();
}

function renderAll() {
  // Preserve scroll position on My Data page before clearing innerHTML
  let savedScrollPosition = 0;
  if (appState.ui.currentPage === "myData") {
    const mainContent = document.getElementById("main-content");
    savedScrollPosition = mainContent ? mainContent.scrollTop : 0;
  }

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
  renderNewWorkoutModal();
  renderEditWorkoutModal();
  renderDeleteLogModal();
  renderDeleteWorkoutModal();
  renderCancelChangesModal();
  renderResetOptionsModal();
  renderSupersetModal();
  renderPartnerModal();
  renderConfigModal();
  renderVideoPlayer();
  if (appState.session.playCompletionAnimation) {
    appState.session.playCompletionAnimation = false;
  }

  // Restore scroll position on My Data page after all rendering complete
  if (appState.ui.currentPage === "myData" && savedScrollPosition > 0) {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.scrollTop = savedScrollPosition;
    }
  }
}

function renderModalsOnly() {
  // Render only modals without touching page content
  // Used by modalService when skipPageRender = true to avoid reloading the page
  renderResetConfirmationModal();
  renderNewWorkoutModal();
  renderEditWorkoutModal();
  renderDeleteLogModal();
  renderDeleteWorkoutModal();
  renderCancelChangesModal();
  renderResetOptionsModal();
  renderSupersetModal();
  renderPartnerModal();
  renderConfigModal();
  renderVideoPlayer();
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
      renderModalsOnly,
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
    renderModalsOnly,
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

// KNOWN ISSUE: DevTools Mobile Mode Resume Lag (~200ms)
// DO NOT REMOVE: Attempted fix for DevTools-specific performance issue
//
// Issue: When F12 reopens with mobile mode already active (state restoration),
// Chrome defers layout recalculation until first user interaction = 200ms lag.
// This does NOT occur when manually switching to mobile mode (Ctrl+Shift+M).
//
// Attempted fixes that did NOT resolve the issue:
// 1. CSS containment (contain: style) on .app-container, .card, modals
//    Note: Changed from 'layout style' to 'style' to prevent stacking context issues
//    'contain: layout' creates isolated stacking contexts preventing z-index overlay
// 2. Moving actionService.initialize() before rendering
// 3. Force layout with document.body.offsetHeight after renderAll()
// 4. Resize event listener with debounced layout force (below)
//
// Status: Unresolved - appears to be Chrome DevTools internal behavior
// Impact: DevTools only, does NOT affect real phone performance
// Decision: Documented for future investigation, not blocking release
//
// For future debugging:
// - Check Chrome DevTools Performance trace for "ParseHTML" during first click
// - Compare INP metrics: laggy state ~200ms, post-refresh ~10ms
// - Test on real device via chrome://inspect to verify no phone impact
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    document.body.offsetHeight;
  }, 100);
});

document.addEventListener("DOMContentLoaded", checkAuthAndInitialize);
