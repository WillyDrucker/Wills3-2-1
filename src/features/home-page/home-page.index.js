import { ui } from "ui";
import { getHomePageTemplate } from "./home-page.template.js";

export function renderHomePage() {
  ui.mainContent.innerHTML = getHomePageTemplate();
}
