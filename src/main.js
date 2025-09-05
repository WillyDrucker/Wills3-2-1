import { appState } from "state";
import { ui } from "ui";
import * as workoutService from "services/workoutService.js";
import * as workoutFactoryService from "services/workoutFactoryService.js";
import * as scrollService from "services/scrollService.js";
import * as persistenceService from "services/persistenceService.js";
import * as appInitializerService from "services/appInitializerService.js";

// --- Import Feature Renderers ---
import { renderAppHeader } from "features/app-header/app-header.index.js";
import { renderHomePage } from "features/home-page/home-page.index.js";
import { renderMyDataPage } from "features/my-data/my-data.index.js";
import { renderSideNav } from "features/side-nav/side-nav.index.js";
import { renderResetConfirmationModal } from "features/reset-confirmation-modal/reset-confirmation-modal.index.js";
import { renderVideoPlayer } from "features/video-player/video-player.index.js";
import { renderSupersetModal } from "features/superset-modal/superset-modal.index.js";
import { renderPartnerModal } from "features/partner-modal/partner-modal.index.js";
import { renderWorkoutLog } from "features/workout-log/workout-log.index.js";
import { renderConfigCard } from "features/config-card/config-card.index.js";
import {
  renderActiveExerciseCard,
  initializeActiveCardEventListeners,
} from "features/active-exercise-card/active-exercise-card.index.js";
import { renderWorkoutResultsCard } from "features/workout-results-card/workout-results-card.index.js";

// --- Core State & Render Functions ---

function updateActiveWorkoutAndLog() {
  if (appState.partner.isActive) {
    appState.session.workoutLog =
      workoutFactoryService.generatePartnerWorkoutLog();
  } else if (appState.superset.isActive) {
    appState.session.workoutLog =
      workoutFactoryService.generateSupersetWorkoutLog();
  } else {
    appState.session.workoutLog = workoutFactoryService.generateWorkoutLog();
  }
  workoutService.recalculateCurrentStateAfterLogChange();
  renderAll();
  persistenceService.saveState();
}

/**
 * CEMENTED
 * This is the application's main render loop and the heart of the Prime Directive.
 * It is responsible for clearing the main content areas and re-rendering the
 * entire visible UI from the current `appState`. Its structure is definitive.
 * Do not modify without a significant architectural review.
 */
function renderAll() {
  ui.configSection.innerHTML = "";
  ui.mainContent.innerHTML = "";
  ui.workoutFooter.innerHTML = "";
  renderAppHeader();
  if (appState.ui.currentPage === "home") {
    renderHomePage();
  } else if (appState.ui.currentPage === "myData") {
    renderMyDataPage();
  } else {
    workoutService.updateWorkoutTimeRemaining();
    if (appState.session.isWorkoutComplete) {
      renderWorkoutResultsCard();
    } else {
      renderConfigCard();
      renderActiveExerciseCard();
    }
    renderWorkoutLog();
  }
  renderSideNav();
  renderResetConfirmationModal();
  renderSupersetModal();
  renderPartnerModal();
  renderVideoPlayer();
  if (appState.ui.scrollAfterRender.target === "active-card") {
    scrollService.scrollToActiveCard();
    appState.ui.scrollAfterRender.target = null;
  }
  if (appState.session.playCompletionAnimation) {
    appState.session.playCompletionAnimation = false;
  }
}

/**
 * CEMENTED
 * A stable, simple utility for displaying a top-level error message.
 */
function renderError(message) {
  ui.mainContent.innerHTML = `<div class="card rest-day-container"><span class="rest-day-text text-skip">${message}</span></div>`;
  ui.configSection.innerHTML = "";
  ui.workoutFooter.innerHTML = "";
}

// --- App Initialization ---

document.addEventListener("DOMContentLoaded", () => {
  appInitializerService.initialize({
    renderAll,
    updateActiveWorkoutAndLog,
    renderError,
    initializeActiveCardEventListeners,
    renderConfigCard,
    renderActiveExerciseCard,
  });
});
