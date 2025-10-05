/* ==========================================================================
   WAKE LOCK - Screen Wake Lock Management

   Prevents screen from sleeping during workout sessions using the Screen Wake
   Lock API. Automatically handles visibility changes and page hide events.

   🔒 CEMENT: Visibility check prevents initialization errors
   - Only requests wake lock when page is visible
   - Prevents NotAllowedError on background page load
   - Automatically re-requests when page becomes visible

   Dependencies: None (browser Wake Lock API)
   Used by: appInitializerService.js (initialization)
   ========================================================================== */

let wakeLockSentinel = null;

async function requestWakeLock() {
  if ("wakeLock" in navigator) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request("screen");
      wakeLockSentinel.addEventListener("release", () => {});
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  }
}

export async function releaseWakeLock() {
  if (wakeLockSentinel) {
    await wakeLockSentinel.release();
    wakeLockSentinel = null;
  }
}

async function handleVisibilityChangeForWakeLock() {
  if (wakeLockSentinel !== null && document.visibilityState === "visible") {
    await requestWakeLock();
  }
}

export function initializeWakeLock() {
  document.addEventListener(
    "visibilitychange",
    handleVisibilityChangeForWakeLock
  );
  document.addEventListener("pagehide", releaseWakeLock);

  // Only request wake lock if page is visible
  if (document.visibilityState === "visible") {
    requestWakeLock();
  }
}
