// CEMENTED (Workout Results — Animation replay):
// - Auto-replay on render (covers refresh/direct nav)
// - Delegated click handler on [data-action="replayAnimation"] to restart animation
import { ui } from "ui";
import { getWorkoutResultsCardTemplate } from "./workout-results-card.template.js";

export function renderWorkoutResultsCard() {
  ui.mainContent.innerHTML = getWorkoutResultsCardTemplate();

  // CEMENTED: Replay logic is architectural; ensures completion animation plays on refresh and can be retriggered.
  const container = ui.mainContent.querySelector("#active-card-container .completion-animation-container");
  if (container) {
    // Auto-replay on render (covers page refresh / deep link)
    replayCompletionAnimation(container);
  }

  // Event delegation for replay clicks anywhere inside the animation block
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
  // Force reflow so the animation can restart
  // eslint-disable-next-line no-unused-expressions
  void el.offsetWidth;
  el.classList.add("is-animating");
}
