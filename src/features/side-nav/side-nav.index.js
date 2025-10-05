/* ==========================================================================
   SIDE NAV - Business Logic

   Handles side navigation panel open/close state, focus trap, and rendering.
   Closes all selectors before opening, syncs fullscreen state, and manages
   focus restoration on close.

   🔒 CEMENT: Fullscreen state synchronization
   - Checks actual browser fullscreen state on open
   - Corrects appState if user exited fullscreen via device navigation
   - Ensures UI reflects true fullscreen status

   Dependencies: appState, ui, focusTrapService, selectorService, getSideNavTemplate
   Used by: actionService (openSideNav, closeSideNav), main.js
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getSideNavTemplate } from "./side-nav.template.js";
import * as focusTrapService from "lib/focusTrap.js";
import * as selectorService from "services/ui/selectorService.js";

export function handleOpenSideNav() {
  if (appState.ui.sideNav.isOpen) return;
  selectorService.closeAll();
  appState.ui.modal.elementToFocusOnClose = document.activeElement;

  /* 🔒 CEMENT: Synchronize app state with browser's actual fullscreen state */
  /* Corrects UI if user exits fullscreen using device navigation */
  appState.ui.isFullscreen = !!document.fullscreenElement;

  appState.ui.sideNav.isOpen = true;
  document.documentElement.classList.add("is-side-nav-open");
  renderSideNav();

  const sideNavContent = document.querySelector(".side-nav-content");
  if (sideNavContent) focusTrapService.activate(sideNavContent);
}

export function handleCloseSideNav() {
  if (!appState.ui.sideNav.isOpen) return;

  appState.ui.sideNav.isOpen = false;
  document.documentElement.classList.remove("is-side-nav-open");
  renderSideNav();

  focusTrapService.deactivate();
  appState.ui.modal.elementToFocusOnClose?.focus();
  appState.ui.modal.elementToFocusOnClose = null;
}

export function renderSideNav() {
  ui.sideNavContainer.innerHTML = getSideNavTemplate();
}
