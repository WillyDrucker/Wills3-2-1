/* ==========================================================================
   WORKOUT RESULTS CARD - Business Logic

   Renders workout completion card with plate stacking animations. Handles
   auto-replay on render and manual replay via event delegation.

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
}

function replayCompletionAnimation(el) {
  el.classList.remove("is-animating");
  /* 🔒 CEMENT: Force reflow so CSS animation can restart */
  // eslint-disable-next-line no-unused-expressions
  void el.offsetWidth;
  el.classList.add("is-animating");
}
