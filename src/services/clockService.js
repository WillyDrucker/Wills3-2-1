// This file is new
import { appState } from "state";
import { formatTime12Hour } from "utils";

let _renderActiveCardHeader = null;
let _renderConfigHeaderLine = null;

// 🔒 CEMENT: Updates clock display on 60-second intervals
// Reduces battery usage and prevents UI re-render issues
function updateTime() {
  const now = new Date();
  const newTime = formatTime12Hour(now);

  // Only update state and re-render if time has changed
  if (newTime !== appState.ui.currentTime) {
    appState.ui.currentTime = newTime;

    // Update config header clock (if on workout page)
    if (_renderConfigHeaderLine && appState.ui.currentPage === "workout" && !appState.session.isWorkoutComplete) {
      _renderConfigHeaderLine();
    }

    // Update active card header clock (if on workout page)
    if (_renderActiveCardHeader && appState.ui.currentPage === "workout" && !appState.session.isWorkoutComplete) {
      _renderActiveCardHeader();
    }
  }
}

/**
 * Initializes the clock service with 60-second updates
 * @param {object} dependencies - An object containing necessary functions
 * @param {function} dependencies.renderActiveCardHeader - Re-renders only the active card header
 * @param {function} dependencies.renderConfigHeaderLine - Re-renders only the config header line
 */
export function initialize(dependencies) {
  _renderActiveCardHeader = dependencies.renderActiveCardHeader;
  _renderConfigHeaderLine = dependencies.renderConfigHeaderLine;
  // Update every 60 seconds to save battery and prevent re-render issues
  setInterval(updateTime, 60000);
  // Set the initial time immediately
  updateTime();
  // Also update on any user interaction via renderAll()
}
