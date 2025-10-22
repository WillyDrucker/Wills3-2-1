/* ==========================================================================
   SCROLL SERVICE - Smart Viewport Scrolling

   Handles intelligent scrolling when selectors open to prevent menu overflow.
   Special handling for exercise selector to ensure full visibility.

   🔒 CEMENT: Viewport overflow prevention
   - Config card: Scroll only if selector menu overflows viewport
   - Active card exercise selector: Scroll to top ONLY if dropdown overflows viewport
   - Active card other selectors: Scroll just enough to show menu if overflow
   - Log items: Scroll edit controls into view if needed
   - 16px buffer for comfortable spacing

   🔒 CEMENT: Exercise Selector Conditional Scroll
   When "Current Exercise" dropdown opens:
   1. Calculate if dropdown menu would overflow viewport bottom
   2. If overflow detected:
      - Scroll active card to top (selector border at viewport top)
      - User can then scroll with touch/scroll wheel to navigate dropdown
   3. If no overflow:
      - No scroll - dropdown already fully visible
      - Prevents unnecessary viewport jumping

   Dependencies: scrollToElement utility
   Used by: selectorService, actionService
   ========================================================================== */

import { scrollToElement } from "utils";

export function handleSelectorOpening(detailsElement) {
  requestAnimationFrame(() => {
    const configCard = detailsElement.closest("#config-card");
    const activeCard = detailsElement.closest("#active-card-container");
    const logItem = detailsElement.closest(".workout-log-item-container");

    if (configCard) {
      // Config card: only scroll if selector menu would overflow viewport
      const optionsList = detailsElement.querySelector(".options-list");
      if (optionsList) {
        const menuRect = optionsList.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        if (menuRect.bottom > viewportHeight) {
          const scrollAmount = menuRect.bottom - viewportHeight + 16;
          window.scrollBy({ top: scrollAmount, behavior: "smooth" });
        }
      }
    } else if (activeCard) {
      // Active card: Scroll only if selector menu would overflow viewport
      const isExerciseSelector = detailsElement.id === "exercise-selector";
      const optionsList = detailsElement.querySelector(".options-list");

      if (optionsList) {
        const menuRect = optionsList.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        if (menuRect.bottom > viewportHeight) {
          // Menu overflows viewport
          if (isExerciseSelector) {
            // Exercise selector: scroll active card to top so selector is at viewport top
            // User can then scroll with touch/scroll wheel to navigate long dropdown
            scrollToElement("#active-card-container", { block: "start" });
          } else {
            // Other selectors: scroll just enough to show full menu
            const scrollAmount = menuRect.bottom - viewportHeight + 16;
            window.scrollBy({ top: scrollAmount, behavior: "smooth" });
          }
        }
        // If menu fits in viewport, don't scroll
      }
    } else if (logItem) {
      const editControls = logItem.querySelector(".edit-log-controls");
      if (editControls) {
        const menuRect = editControls.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        if (menuRect.bottom > viewportHeight) {
          const scrollAmount = menuRect.bottom - viewportHeight + 16;
          window.scrollBy({ top: scrollAmount, behavior: "smooth" });
        }
      }
    }
  });
}

export function scrollToActiveCard() {
  scrollToElement("#active-card-container", { block: "start" });
}

export function scrollToWorkoutLog() {
  scrollToElement("#workout-log-card", { block: "start" });
}

export function scrollToConfigCard() {
  scrollToElement("#config-card", { block: "start" });
}
