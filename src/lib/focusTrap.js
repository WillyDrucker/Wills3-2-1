let trapContainer = null;
let focusableElements = [];
let firstFocusableElement = null;
let lastFocusableElement = null;

const focusableQuery =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function keydownHandler(e) {
  const isTabPressed = e.key === "Tab";

  if (!isTabPressed) {
    return;
  }

  if (e.shiftKey) {
    if (document.activeElement === firstFocusableElement) {
      lastFocusableElement.focus();
      e.preventDefault();
    }
  } else {
    if (document.activeElement === lastFocusableElement) {
      firstFocusableElement.focus();
      e.preventDefault();
    }
  }
}

export function activate(element) {
  trapContainer = element;
  focusableElements = [...trapContainer.querySelectorAll(focusableQuery)];
  firstFocusableElement = focusableElements[0];
  lastFocusableElement = focusableElements[focusableElements.length - 1];

  document.addEventListener("keydown", keydownHandler);

  if (firstFocusableElement) {
    firstFocusableElement.focus();
  }
}

export function deactivate() {
  document.removeEventListener("keydown", keydownHandler);
  trapContainer = null;
}
