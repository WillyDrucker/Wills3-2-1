/* ==========================================================================
   APP HEADER - TEMPLATE GENERATOR

   CEMENT: Inline SVGs for robustness - no external dependencies or MIME type issues
   Architecture: Dynamic template with conditional home icon visibility

   Component Structure:
   ├── getHeaderTemplate() - Main template function
   ├── Home icon with conditional visibility (hidden on home page)
   ├── Application title (Will's 3-2-1)
   └── Hamburger menu icon (always visible)

   Dependencies: State management for page detection
   - Global: appState.ui.currentPage for home icon visibility
   - Local: Inline SVG icons (Material Design), accessibility attributes
   - Target: Three-column grid structure defined in app-header.style.css

   Used by: app-header.index.js (renderAppHeader function)
   ========================================================================== */

import { appState } from "state";

/**
 * 🔒 CEMENT: Inline SVGs eliminate external dependencies and prevent MIME type errors
 * Material Design icons embedded directly for maximum reliability
 */
export function getHeaderTemplate() {
  const isHomePage = appState.ui.currentPage === "home";

  // 🔒 CEMENT: Home icon hidden on home page to prevent redundant navigation
  // Material Design "home" icon (24x24 viewBox) with data-action for event delegation
  const homeIcon = `
      <button class="header-icon-button" data-action="goHome" ${
        isHomePage ? "style='visibility: hidden;'" : ""
      } aria-label="Go Home">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"/>
        </svg>
      </button>
    `;

  // 🔒 CEMENT: Hamburger menu always visible for consistent navigation access
  // Material Design "menu" icon (24x24 viewBox) with data-action for event delegation
  const hamburgerIcon = `
      <button class="header-icon-button" data-action="openSideNav" aria-label="Open Menu">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>
    `;

  // 🔒 CEMENT: Three-column layout order: Home Icon | Title | Menu Icon
  // Title uses truncate-text class for text overflow handling (though truncation unlikely)
  return `
      ${homeIcon}
      <h1 class="truncate-text">Will's 3-2-1</h1>
      ${hamburgerIcon}
    `;
}
