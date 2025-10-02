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
      // Active card: only scroll if selector menu would overflow viewport
      const optionsList = detailsElement.querySelector(".options-list");
      if (optionsList) {
        const menuRect = optionsList.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        if (menuRect.bottom > viewportHeight) {
          const scrollAmount = menuRect.bottom - viewportHeight + 16;
          window.scrollBy({ top: scrollAmount, behavior: "smooth" });
        }
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
