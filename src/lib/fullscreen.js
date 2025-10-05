/* ==========================================================================
   FULLSCREEN - Fullscreen API with Screen Orientation Lock

   Manages fullscreen mode with browser vendor prefixes (webkit support).
   Locks screen orientation to portrait after entering fullscreen.

   🔒 CEMENT: Screen orientation lock MUST happen after fullscreen entry
   - Orientation lock API only works when already in fullscreen mode
   - Lock called in enterFullScreenAndLock() after requestFullscreen()

   Dependencies: state (appState), screenOrientation (lockScreenOrientation)
   Used by: side-nav.index.js (fullscreen toggle), actionHandlers.js
   ========================================================================== */

import { appState } from "state";
import { lockScreenOrientation } from "lib/screenOrientation.js";

// This function needs access to the renderer for the side nav.
let _renderSideNav = null;

export function initialize(renderSideNav) {
  _renderSideNav = renderSideNav;
}

async function enterFullScreenAndLock() {
  const docEl = document.documentElement;
  if (docEl.requestFullscreen) {
    await docEl.requestFullscreen();
  } else if (docEl.webkitRequestFullscreen) {
    await docEl.webkitRequestFullscreen();
  }
  /* 🔒 CEMENT: Lock screen orientation after entering fullscreen */
  await lockScreenOrientation();
}

async function exitFullScreen() {
  if (document.exitFullscreen) {
    await document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    await document.webkitExitFullscreen();
  }
}

export async function toggleFullScreen() {
  if (!document.fullscreenElement) {
    await enterFullScreenAndLock();
  } else {
    await exitFullScreen();
  }
}

export function handleFullScreenChange() {
  appState.ui.isFullscreen = !!document.fullscreenElement;
  if (_renderSideNav) {
    _renderSideNav();
  }
}
