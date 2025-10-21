/* ==========================================================================
   ACTION HANDLERS - Module Re-export

   This file re-exports action handlers from the modular implementation.
   Maintains backward compatibility with existing imports.

   Modular Structure:
   - actionHandlers.index.js: Main coordinator
   - actionHandlers.navigation.js: Page routing
   - actionHandlers.config.js: Config header operations
   - actionHandlers.selectors.js: Selector interactions
   - actionHandlers.workout.js: Workout set operations
   - actionHandlers.modals.js: Modal operations
   - actionHandlers.global.js: Global utilities

   See actionHandlers.index.js for complete documentation.

   Dependencies: actionHandlers.index.js
   Used by: actions/actionService.js
   ========================================================================== */

export { initialize, getActionHandlers, getSelectorHandlers } from "./actionHandlers.index.js";
