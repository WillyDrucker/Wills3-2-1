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

  requestWakeLock();
}
