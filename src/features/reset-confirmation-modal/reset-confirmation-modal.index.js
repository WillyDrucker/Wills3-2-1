import { appState } from "state";
import { ui } from "ui";
import { getResetConfirmationModalTemplate } from "./reset-confirmation-modal.template.js";
import * as modalService from "services/modalService.js";

export function handleConfirmReset() {
  modalService.close();
}

export function renderResetConfirmationModal() {
  const container = ui.resetConfirmationModalContainer;
  if (container) {
    container.classList.toggle(
      "is-hidden",
      appState.ui.activeModal !== "reset"
    );
    if (appState.ui.activeModal === "reset") {
      container.innerHTML = getResetConfirmationModalTemplate();
    } else {
      container.innerHTML = "";
    }
  }
}
