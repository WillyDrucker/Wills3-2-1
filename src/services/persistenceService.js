import { appState, getInitialAppState } from "state";

const APP_STATE_KEY = "wills-321-app-state";

function cleanRestStateForPersistence(restObj) {
  const newRestObj = JSON.parse(JSON.stringify(restObj));
  newRestObj.normal.timerId = null;
  newRestObj.superset.left.timerId = null;
  newRestObj.superset.right.timerId = null;
  return newRestObj;
}

/**
 * CEMENTED
 * This function defines the exact shape of the state object that gets persisted
 * to localStorage. It is a core part of the persistence layer.
 */
function getPersistableState(fullState) {
  return {
    saveTimestamp: new Date().toISOString(), // Full ISO string for accurate time checking
    session: fullState.session,
    superset: fullState.superset,
    partner: fullState.partner,
    rest: cleanRestStateForPersistence(fullState.rest),
    user: fullState.user,
    ui: {
      currentPage: fullState.ui.currentPage,
    },
  };
}

export function saveState() {
  try {
    const stateToSave = getPersistableState(appState);
    const serializedState = JSON.stringify(stateToSave);
    localStorage.setItem(APP_STATE_KEY, serializedState);
  } catch (error) {
    console.error("Could not save state to localStorage:", error);
  }
}

/**
 * CEMENTED
 * This function contains the definitive logic for loading state from localStorage,
 * including the critical "clear at midnight" rule. This logic is stable and
 * crucial for correct session management.
 */
export function loadState() {
  try {
    const serializedState = localStorage.getItem(APP_STATE_KEY);
    if (serializedState === null) {
      return null;
    }
    const loadedData = JSON.parse(serializedState);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const savedDate = new Date(loadedData.saveTimestamp);
    const savedDateStr = savedDate.toISOString().slice(0, 10);

    // CEMENTED: Midnight reset logic with 1-hour grace period.
    if (savedDateStr !== todayStr) {
      const savedHour = savedDate.getHours();
      // If the last save was before 11 PM on a previous day, reset the session.
      if (savedHour < 23) {
        // CEMENTED FIX: Instead of creating a partial state, signal that a full reset is needed.
        return {
          needsReset: true,
          user: loadedData.user, // Pass the user history to preserve it.
          ui: loadedData.ui,
        };
      }
    }

    return loadedData;
  } catch (error) {
    console.error("Could not load state from localStorage:", error);
    return null;
  }
}

function clearState() {
  try {
    localStorage.removeItem(APP_STATE_KEY);
  } catch (error) {
    console.error("Could not clear state from localStorage:", error);
  }
}

/**
 * CEMENTED
 * The definitive, failsafe procedure for a hard reset of the application.
 * The sequence of removing the unload listener before clearing storage is critical
 * to prevent the in-memory state from being re-saved on navigation.
 */
export function nukeEverything() {
  // CEMENTED FIX: Remove the beforeunload listener before clearing state
  // to prevent the in-memory state from being re-saved.
  window.removeEventListener("beforeunload", saveState);
  clearState();
  window.location.href = "/"; // Hard navigate to the root to force a clean start
}
