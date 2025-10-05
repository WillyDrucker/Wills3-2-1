import { appState } from "state";
import { getCollapsedTemplate } from "./config-card.header.template.collapsed.js";
import { getExpandedTemplate } from "./config-card.header.template.expanded.js";

/* ==========================================================================
   CONFIG HEADER - Main template export

   Delegates to collapsed or expanded template based on state.
   ========================================================================== */

export function getConfigHeaderTemplate() {
  return appState.ui.isConfigHeaderExpanded ? getExpandedTemplate() : getCollapsedTemplate();
}
