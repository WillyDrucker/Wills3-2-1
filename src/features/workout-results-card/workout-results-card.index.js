import { ui } from "ui";
import { getWorkoutResultsCardTemplate } from "./workout-results-card.template.js";

export function renderWorkoutResultsCard() {
  ui.mainContent.innerHTML = getWorkoutResultsCardTemplate();
}
