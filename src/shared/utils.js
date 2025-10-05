/* ==========================================================================
   UTILS - Utility Functions Index

   Re-exports all utility functions from organized modules for backward
   compatibility. Allows importing from "utils" while maintaining organized
   code structure in utils/ subfolder.

   🔒 CEMENT: Backward compatibility layer
   - All existing imports from "utils" continue to work
   - Functions now organized into logical modules
   - No breaking changes to existing code

   Module Organization:
   - timeUtils.js: Time and date formatting
   - calendarUtils.js: Calendar and week calculations
   - domUtils.js: DOM manipulation utilities
   - generalUtils.js: Miscellaneous helper functions

   Dependencies: None (just re-exports)
   Used by: Entire application
   ========================================================================== */

// Time utilities
export {
  getTodayDayName,
  getDurationUnit,
  formatTime,
  formatTimestamp,
  formatTime12Hour,
  calculateCompletionTime,
} from "./utils/timeUtils.js";

// Calendar utilities
export {
  getWeekRange,
  getDaysInWeek,
  isDateInFuture,
} from "./utils/calendarUtils.js";

// DOM utilities
export {
  scrollToElement,
  loadScriptOnce,
} from "./utils/domUtils.js";

// General utilities
export {
  getYouTubeVideoId,
  isDumbbellExercise,
  getNextWorkoutDay,
  pluralize,
} from "./utils/generalUtils.js";

// UI components and DOM references
export {
  ui,
  createNumberInputHTML,
  createSelectorHTML,
} from "./utils/uiComponents.js";

// Session validation
export {
  canCycleToSession,
} from "./utils/sessionValidation.js";
