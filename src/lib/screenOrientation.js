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
