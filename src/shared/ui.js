/* ==========================================================================
   UI - Backward Compatibility Re-export

   Re-exports ui components from shared/utils/uiComponents.js for backward
   compatibility. All existing imports from "ui" continue to work.

   Dependencies: None (just re-exports)
   Used by: All feature components, main.js, service layer
   ========================================================================== */

export {
  ui,
  createNumberInputHTML,
  createSelectorHTML,
} from "./utils/uiComponents.js";
