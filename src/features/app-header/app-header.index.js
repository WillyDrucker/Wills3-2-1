/* ==========================================================================
   APP HEADER - RENDER CONTROLLER

   CEMENT: Global navigation header rendered once on application initialization
   Architecture: Simple render function that populates the header DOM element

   Component Structure:
   ├── renderAppHeader() - Main render function called from main.js
   ├── Uses getHeaderTemplate() for HTML generation
   └── Targets #app-header DOM element via ui.appHeader reference

   Dependencies: DOM utilities, template generation
   - Global: ui.js DOM references, app-header.template.js
   - State: appState (consumed by template for home icon visibility)
   - Target: #app-header element in index.html

   Used by: main.js (application initialization)
   ========================================================================== */

import { ui } from "ui";
import { getHeaderTemplate } from "./app-header.template.js";

/**
 * Renders the global application header with navigation controls
 *
 * 🔒 CEMENT: Called once during app initialization to populate header
 * Template handles dynamic content (home icon visibility based on current page)
 */
export function renderAppHeader() {
  ui.appHeader.innerHTML = getHeaderTemplate();
}
