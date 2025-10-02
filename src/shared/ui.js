export const ui = {
  appHeader: document.getElementById("app-header"),
  configSection: document.getElementById("config-section"),
  mainContent: document.getElementById("main-content"),
  workoutFooter: document.getElementById("workout-footer-section"),
  videoPlayerModalContainer: document.getElementById(
    "video-player-modal-container"
  ),
  supersetModalContainer: document.getElementById(
    "superset-selection-modal-container"
  ),
  partnerModalContainer: document.getElementById("partner-modal-container"),
  sideNavContainer: document.getElementById("side-nav-container"),
  configModalContainer: document.getElementById("config-modal-container"),
  resetConfirmationModalContainer: document.getElementById(
    "reset-confirmation-modal-container"
  ),
};

export function createNumberInputHTML(
  id,
  value,
  isEditMode = false,
  logIndex = -1
) {
  const dataAttr = isEditMode ? `data-log-index="${logIndex}"` : "";
  return `
      <div class="number-input-container">
        <button type="button" data-action="decrement" data-input-id="${id}" ${dataAttr}><span class="decrement-button-symbol">-</span></button>
        <input type="number" id="${id}-input" value="${value}" min="0" max="999" readonly ${dataAttr}>
        <button type="button" data-action="increment" data-input-id="${id}" ${dataAttr}>+</button>
      </div>`;
}

export function createSelectorHTML(
  id,
  summaryHtml,
  optionsHtml,
  isSelectorDisabled = false,
  isContentMuted = false
) {
  const disabledClass = isSelectorDisabled ? "is-muted" : "";
  const contentMutedClass = isContentMuted ? "is-content-muted" : "";
  return `<details class="app-selector ${disabledClass}" id="${id}"><summary class="${contentMutedClass}">${summaryHtml}</summary><ul class="options-list">${optionsHtml}</ul></details>`;
}
