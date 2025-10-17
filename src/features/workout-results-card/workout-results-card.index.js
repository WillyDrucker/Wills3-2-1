/* ==========================================================================
   WORKOUT RESULTS CARD - Business Logic

   Renders workout completion card with plate stacking animations. Handles
   auto-replay on render, manual replay via event delegation, and button
   state transitions after animation completes.

   Architecture: Button state transition
   - Initial state: Green "Workout Saved!" (button-log class, disabled)
   - After 4000ms: Blue "Begin Another Workout" (button-finish class, enabled)
   - Timing: 3s animation + 1s buffer = 4000ms delay

   🔒 CEMENT: Animation replay architecture
   - Auto-replay on render (covers page refresh/direct navigation)
   - Event delegation on data-action="replayAnimation" for manual replay
   - Force reflow (offsetWidth read) required to restart CSS animation

   Dependencies: ui, getWorkoutResultsCardTemplate
   Used by: actionService (finishWorkout), main.js (renderWorkoutResultsCard)
   ========================================================================== */

import { ui } from "ui";
import { getWorkoutResultsCardTemplate } from "./workout-results-card.template.js";

export function renderWorkoutResultsCard() {
  ui.mainContent.innerHTML = getWorkoutResultsCardTemplate();

  /* 🔒 CEMENT: Replay logic ensures completion animation plays on refresh and can be retriggered */
  const container = ui.mainContent.querySelector("#active-card-container .completion-animation-container");
  if (container) {
    /* Auto-replay on render (covers page refresh / deep link) */
    replayCompletionAnimation(container);
  }

  /* Event delegation for replay clicks anywhere inside the animation block */
  ui.mainContent.addEventListener("click", (ev) => {
    const trigger = ev.target.closest("[data-action='replayAnimation']");
    if (trigger) {
      const anim = trigger.closest(".completion-animation-container");
      if (anim) replayCompletionAnimation(anim);
    }
  });

  /* Change button state after animation completes (3s animation + 1s delay = 4s) */
  const button = ui.mainContent.querySelector(".workout-saved-button");
  if (button) {
    setTimeout(() => {
      button.textContent = "Begin Another Workout";
      button.classList.remove("button-log");
      button.classList.add("button-finish");
      button.disabled = false;
    }, 4000);
  }
}

function replayCompletionAnimation(el) {
  el.classList.remove("is-animating");
  /* 🔒 CEMENT: Force reflow so CSS animation can restart */
  // eslint-disable-next-line no-unused-expressions
  void el.offsetWidth;
  el.classList.add("is-animating");
}
