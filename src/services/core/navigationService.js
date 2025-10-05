/* ==========================================================================
   NAVIGATION SERVICE - Page Transitions & Mode Management

   Handles page navigation with cleanup of open UI elements. Manages normal/
   superset/partner mode switching with state reset.

   🔒 CEMENT: Clean navigation transitions
   - Closes all modals, selectors, side nav, and video player before navigation
   - Resets scroll position to top on page change
   - Clears superset/partner state when returning to normal mode

   Dependencies: appState, side nav, video player, selectorService, modalService
   Used by: actionService (page navigation, mode switching), config card
   ========================================================================== */

import { appState } from "state";
import { handleCloseSideNav } from "features/side-nav/side-nav.index.js";
import { handleCloseVideo } from "features/video-player/video-player.index.js";
import * as selectorService from "services/ui/selectorService.js";
import * as modalService from "services/ui/modalService.js";

function _closeAllModalsAndSelectors() {
  handleCloseSideNav();
  handleCloseVideo();
  modalService.close(); // CEMENTED FIX: Use the single, central service to close any active generic modal.
  selectorService.closeAll();
}

export function goToPage(pageName) {
  if (appState.ui.currentPage === pageName) return;

  _closeAllModalsAndSelectors();

  appState.ui.currentPage = pageName;
  window.scrollTo(0, 0);
}

export function setNormalMode() {
  if (!appState.superset.isActive && !appState.partner.isActive) return;

  appState.superset.isActive = false;
  appState.superset.day1 = null;
  appState.superset.day2 = null;

  appState.partner.isActive = false;
  appState.session.currentDayName = appState.todayDayName;
}
