/* ==========================================================================
   PERSISTENCE SERVICE - LocalStorage State Management

   Saves and loads application state to/from localStorage. Implements midnight
   reset logic and timer cleanup for safe state restoration.

   Midnight reset logic:
   - Compares save timestamp with current date (using Date objects)
   - If saved on a different day, flags for reset via needsReset signal
   - Preserves user history and page state across resets
   - Cleans timer IDs before saving (non-serializable)

   Dependencies: appState, getInitialAppState, supabaseClient
   Used by: All state-changing operations, appInitializerService (load on startup)
   ========================================================================== */

import { appState, getInitialAppState } from "state";
import { supabase } from "lib/supabaseClient.js";

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

    // Migration: Rename currentWorkoutPlanName → currentWorkoutName
    if (loadedData.session?.currentWorkoutPlanName !== undefined) {
      loadedData.session.currentWorkoutName = loadedData.session.currentWorkoutPlanName;
      delete loadedData.session.currentWorkoutPlanName;
    }

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

/**
 * Delete uncommitted workout session from database
 * Called before nuking everything to clean up stale database entries
 * Only deletes the current session's workout if it's not committed
 */
async function deleteUncommittedSession() {
  try {
    const userId = appState.auth?.user?.id;
    const sessionId = appState.session?.id;

    // Skip if not authenticated or no active session
    if (!userId || !sessionId) {
      return;
    }

    console.log('[Nuke] Checking for uncommitted workout session:', sessionId);

    // Delete only the current session's workout if it exists and is not committed
    const { data: deletedWorkouts, error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", userId)
      .eq("is_committed", false)
      .select();

    if (error) {
      console.error('[Nuke] Error deleting uncommitted workout:', error);
      return;
    }

    if (deletedWorkouts && deletedWorkouts.length > 0) {
      console.log('[Nuke] Deleted uncommitted workout:', deletedWorkouts[0]);
    } else {
      console.log('[Nuke] No uncommitted workout found to delete');
    }
  } catch (error) {
    console.error('[Nuke] Unexpected error deleting uncommitted workout:', error);
  }
}

// Hard reset: remove beforeunload listener, delete uncommitted session, clear state
export async function nukeEverything() {
  window.removeEventListener("beforeunload", saveState);

  // Delete any uncommitted workout session from database before clearing local state
  await deleteUncommittedSession();

  clearState();
  window.location.href = "/";
}
