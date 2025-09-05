import { appState } from "state";

/**
 * DEFINITIVE FIX (User-Provided):
 * This template is restored to its correct function, rendering only the app
 * header. All incorrect imports have been removed, which resolves the
 * application-breaking MIME type errors. Inline SVGs are used for robustness.
 */
export function getHeaderTemplate() {
  const isHomePage = appState.ui.currentPage === "home";

  const homeIcon = `
      <button class="header-icon-button" data-action="goHome" ${
        isHomePage ? "style='visibility: hidden;'" : ""
      } aria-label="Go Home">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"/>
        </svg>
      </button>
    `;

  const hamburgerIcon = `
      <button class="header-icon-button" data-action="openSideNav" aria-label="Open Menu">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>
    `;

  return `
      ${homeIcon}
      <h1 class="truncate-text">Will's 3-2-1</h1>
      ${hamburgerIcon}
    `;
}
