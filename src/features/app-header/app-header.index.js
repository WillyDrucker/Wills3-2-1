import { ui } from "ui";
import { getHeaderTemplate } from "./app-header.template.js";

export function renderAppHeader() {
  ui.appHeader.innerHTML = getHeaderTemplate();
}
