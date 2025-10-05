/* ==========================================================================
   SCREEN ORIENTATION - Screen Orientation Lock API

   Locks screen orientation to portrait-primary mode. Handles API availability
   gracefully (not all browsers support orientation lock).

   🔒 CEMENT: Must be called AFTER entering fullscreen
   - Orientation lock API only works when document is in fullscreen mode
   - Called by fullscreen.js after requestFullscreen() completes

   Dependencies: None (browser Screen Orientation API)
   Used by: fullscreen.js (enterFullScreenAndLock)
   ========================================================================== */

export async function lockScreenOrientation() {
  if (screen.orientation && typeof screen.orientation.lock === "function") {
    try {
      await screen.orientation.lock("portrait-primary");
    } catch (error) {
      console.warn("Could not lock screen orientation:", error.message);
    }
  }
}

export function unlockScreenOrientation() {
  if (screen.orientation && typeof screen.orientation.unlock === "function") {
    screen.orientation.unlock();
  }
}
