/* ==========================================================================
   HOME PAGE - Business Logic

   Renders the home page with training, navigation, and workout history sections.
   Simple render function that populates main content area.

   Dependencies: ui, getHomePageTemplate
   Used by: actionService (goHome), main.js (default page render)
   ========================================================================== */

import { ui } from "ui";
import { getHomePageTemplate } from "./home-page.template.js";

export function renderHomePage() {
  ui.mainContent.innerHTML = getHomePageTemplate();
}
