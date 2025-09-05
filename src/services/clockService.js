// This file is new
import { appState } from "state";
import { formatTime12Hour } from "utils";

let _renderActiveCardHeader = null;

// The heart of the real-time clock. Updates state and triggers a targeted re-render.
function updateTime() {
  const now = new Date();
  const newTime = formatTime12Hour(now);

  // CEMENTED (Performance): Only update state and re-render if the minute has changed.
  // This provides minute-perfect accuracy without re-rendering the DOM every second.
  if (newTime !== appState.ui.currentTime) {
    appState.ui.currentTime = newTime;
    if (_renderActiveCardHeader) {
      _renderActiveCardHeader();
    }
  }
}

/**
 * Initializes the clock service.
 * @param {object} dependencies - An object containing necessary functions.
 * @param {function} dependencies.renderActiveCardHeader - A function that only re-renders the header of the active card.
 */
export function initialize(dependencies) {
  _renderActiveCardHeader = dependencies.renderActiveCardHeader;
  // Check every second to ensure the clock updates as soon as the minute changes.
  setInterval(updateTime, 1000);
  // Set the initial time immediately
  updateTime();
}
