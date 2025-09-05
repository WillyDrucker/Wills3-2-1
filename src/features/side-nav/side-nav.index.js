import { appState } from "state";
import { ui } from "ui";
import { getSideNavTemplate } from "./side-nav.template.js";
import * as focusTrapService from "lib/focusTrap.js";
import * as selectorService from "services/selectorService.js";

export function handleOpenSideNav() {
  if (appState.ui.sideNav.isOpen) return;
  selectorService.closeAll();
  appState.ui.modal.elementToFocusOnClose = document.activeElement;

  // CEMENTED FIX: Synchronize app state with the browser's actual fullscreen state.
  // This corrects the UI if the user exits fullscreen using device navigation.
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
