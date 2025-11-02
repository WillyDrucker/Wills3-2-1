/* ==========================================================================
   WORKOUT RESULTS CARD - Business Logic

   Renders workout completion card with plate stacking animations and two
   action buttons. Handles auto-replay on render and manual replay via
   event delegation.

   Architecture:
   - Plate stacking animation (3s duration)
   - "Workout Complete!" text (static green)
   - "Begin Another Workout" button (blue, enabled immediately)
   - "My Data" button (green, shows "Workout Saved!" during animation, then "My Data")

   🔒 CEMENT: Animation replay architecture
   - Auto-replay on render (covers page refresh/direct navigation)
   - Event delegation on data-action="replayAnimation" for manual replay
   - Force reflow (offsetWidth read) required to restart CSS animation
   - Button text resets on replay (back to "Workout Saved!", re-runs swap)

   Dependencies: ui, getWorkoutResultsCardTemplate
   Used by: actionService (finishWorkout), main.js (renderWorkoutResultsCard)
   ========================================================================== */

import { ui } from "ui";
import { getWorkoutResultsCardTemplate } from "./workout-results-card.template.js";

// Animation timing constant - matches plate stack animation duration in CSS
const PLATE_ANIMATION_DURATION = 3000; // 3s plate stacking animation

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
      if (anim) {
        replayCompletionAnimation(anim);

        // Reset button text swap animation when replaying
        const button = ui.mainContent.querySelector(".workout-saved-button");
        if (button) {
          // Reset to "Workout Saved!"
          button.textContent = "Workout Saved!";

          // Clear any existing timeout
          if (button.swapTimeout) {
            clearTimeout(button.swapTimeout);
          }

          // Set new timeout to swap to "My Data"
          button.swapTimeout = setTimeout(() => {
            button.textContent = "My Data";
            delete button.swapTimeout;
          }, PLATE_ANIMATION_DURATION);
        }
      }
    }
  });

  /* Swap button text "Workout Saved!" to "My Data" after plate animation completes */
  const button = ui.mainContent.querySelector(".workout-saved-button");
  if (button) {
    setTimeout(() => {
      button.textContent = "My Data";
    }, PLATE_ANIMATION_DURATION);
  }
}

function replayCompletionAnimation(el) {
  el.classList.remove("is-animating");
  /* 🔒 CEMENT: Force reflow so CSS animation can restart */
  // eslint-disable-next-line no-unused-expressions
  void el.offsetWidth;
  el.classList.add("is-animating");
}
