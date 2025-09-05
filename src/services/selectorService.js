import * as scrollService from "services/scrollService.js";

export function closeAll() {
  document.body.classList.remove("is-selector-open");
  document.querySelectorAll("details").forEach((detail) => {
    const optionsList = detail.querySelector(".options-list");
    if (optionsList) {
      optionsList.classList.remove("is-scrollable");
      optionsList.style.maxHeight = "";
      optionsList.onscroll = null;
    }
    detail.open = false;
  });
}

export function toggle(detailsElement) {
  const wasOpen = detailsElement.open;

  if (!wasOpen) {
    closeAll();
  }

  detailsElement.open = !wasOpen;

  if (detailsElement.open) {
    document.body.classList.add("is-selector-open");
    scrollService.handleSelectorOpening(detailsElement);
  } else {
    closeAll();
  }
}
