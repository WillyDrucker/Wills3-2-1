/* ==========================================================================
   PERSISTENCE SERVICE - LocalStorage State Management

   Saves and loads application state to/from localStorage. Implements midnight
   reset logic and timer cleanup for safe state restoration.

   Midnight reset logic:
   - Compares save timestamp with current date (using Date objects)
   - If saved on a different day, flags for reset via needsReset signal
   - Preserves user history and page state across resets
   - Cleans timer IDs before saving (non-serializable)

   Dependencies: appState, getInitialAppState
   Used by: All state-changing operations, appInitializerService (load on startup)
   ========================================================================== */

import { appState, getInitialAppState } from "state";

const APP_STATE_KEY = "wills-321-app-state";

function cleanRestStateForPersistence(restObj) {
  const newRestObj = JSON.parse(JSON.stringify(restObj));
  newRestObj.normal.timerId = null;
  newRestObj.superset.left.timerId = null;
  newRestObj.superset.right.timerId = null;
  return newRestObj;
}

function getPersistableState(fullState) {
  return {
    saveTimestamp: new Date().toISOString(),
    session: fullState.session,
    superset: fullState.superset,
    partner: fullState.partner,
    rest: cleanRestStateForPersistence(fullState.rest),
    user: fullState.user,
    auth: fullState.auth,
    ui: {
      currentPage: fullState.ui.currentPage,
      isConfigHeaderExpanded: fullState.ui.isConfigHeaderExpanded,
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

    // Midnight reset with 1-hour grace period (saves before 11 PM trigger reset)
    if (savedDateStr !== todayStr) {
      const savedHour = savedDate.getHours();
      if (savedHour < 23) {
        return {
          needsReset: true,
          user: loadedData.user,
          auth: loadedData.auth,
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

// Hard reset: remove beforeunload listener before clearing to prevent re-save
export function nukeEverything() {
  window.removeEventListener("beforeunload", saveState);
  clearState();
  window.location.href = "/";
}
