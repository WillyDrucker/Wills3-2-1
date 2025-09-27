import { appState } from "state";

export function getAnchorAreaHTML(includeActionPrompt = false) {
  if (appState.superset.isActive || appState.partner.isActive) {
    return getDualModeAnchorAreaHTML();
  } else {
    return getNormalFuelGaugeHTML(includeActionPrompt);
  }
}

function getDualModeAnchorAreaHTML() {
  let hasPendingLeft, hasPendingRight;

  if (appState.partner.isActive || appState.superset.isActive) {
    hasPendingLeft = appState.session.workoutLog.some(
      (log) => log.status === "pending" && log.supersetSide === "left"
    );
    hasPendingRight = appState.session.workoutLog.some(
      (log) => log.status === "pending" && log.supersetSide === "right"
    );
  }

  const inactiveGauge = `<div class="fuel-gauge-container">${Array(5)
    .fill('<div class="fuel-segment"></div>')
    .join("")}</div>`;
  const leftHTML =
    appState.rest.superset.left.type !== "none" ||
    appState.rest.superset.left.isFadingOut
      ? getDualModeFuelGaugeHTML("left")
      : hasPendingLeft
      ? inactiveGauge
      : "";
  const rightHTML =
    appState.rest.superset.right.type !== "none" ||
    appState.rest.superset.right.isFadingOut
      ? getDualModeFuelGaugeHTML("right")
      : hasPendingRight
      ? inactiveGauge
      : "";
  // Check if we should show action prompt overlay
  const isAnySideResting =
    appState.rest.superset.left.type !== "none" ||
    appState.rest.superset.right.type !== "none";

  const overlayHTML = !isAnySideResting
    ? `<div class="action-prompt-overlay">
        <p class="action-prompt-text is-glowing"><span class="truncate-text">${appState.session.activeCardMessage}</span></p>
      </div>`
    : '';

  return `<div class="dual-fuel-gauge-container">
    <div class="fuel-gauge-wrapper" style="flex:1;">${leftHTML}</div>
    <div class="fuel-gauge-wrapper" style="flex:1;">${rightHTML}</div>
    ${overlayHTML}
  </div>`;
}

function getNormalFuelGaugeHTML(includeActionPrompt = false) {
  const restState = appState.rest.normal;
  const activeSegmentIndex =
    restState.type !== "none" ? restState.completedSegments.indexOf(false) : -1;
  const typeForColor = restState.isFadingOut
    ? restState.finalAnimationType
    : restState.type;

  // 🔒 CEMENT: Fuel gauge gets color directly from Current Focus selector value
  // Both timer and fuel gauge independently use currentTimerColorClass
  const colorSuffix = typeForColor === "log"
    ? appState.session.currentTimerColorClass
    : "skip";

  const segmentsHTML = Array(5)
    .fill("")
    .map((_, index) => {
      let classList = "fuel-segment";
      let inlineStyle = "";
      if (typeForColor !== "none") {
        if (restState.isFadingOut) {
          classList += ` is-fading-out-${colorSuffix}`;
          const elapsed = Date.now() - restState.animationStartTime;
          inlineStyle = `style="animation-delay: -${elapsed}ms;"`;
        } else if (restState.completedSegments[index]) {
          classList += ` is-complete-${colorSuffix}`;
        }
        if (restState.animatingSegments[index]) {
          classList += ` is-stamping-${colorSuffix}`;
        }
      }
      if (activeSegmentIndex === index) {
        classList += " is-active";
        const delayStyle = `style="animation-delay: -${
          (300 - restState.timeRemaining) % 60
        }s;"`;
        return `<div class="${classList}"><div class="segment-progress" ${delayStyle}></div></div>`;
      }
      return `<div class="${classList}" ${inlineStyle}></div>`;
    })
    .join("");

  const fuelGaugeHTML = `<div class="fuel-gauge-container">${segmentsHTML}</div>`;

  if (includeActionPrompt) {
    if (restState.type === "none") {
      // Include action prompt overlay for normal workouts when not resting
      const glowingClass = "is-glowing";
      return `
        <div class="fuel-gauge-with-overlay">
          ${fuelGaugeHTML}
          <div class="action-prompt-overlay">
            <p class="action-prompt-text ${glowingClass}"><span class="truncate-text">${appState.session.activeCardMessage}</span></p>
          </div>
        </div>
      `;
    } else if (restState.type === "log") {
      // Show "Recovering" text when actively resting from a logged set
      return `
        <div class="fuel-gauge-with-overlay">
          ${fuelGaugeHTML}
          <div class="action-prompt-overlay">
            <p class="recovering-text"><span class="truncate-text">Recovering</span></p>
          </div>
        </div>
      `;
    }
  }

  return fuelGaugeHTML;
}

function getDualModeFuelGaugeHTML(side) {
  const restState = appState.rest.superset[side];
  const activeSegmentIndex =
    restState.type !== "none" ? restState.completedSegments.indexOf(false) : -1;
  const typeForColor = restState.isFadingOut
    ? restState.finalAnimationType
    : restState.type;
  let colorSuffix = "none";

  if (typeForColor === "log") {
    if (appState.partner.isActive) {
      colorSuffix = side === "left" ? "log-left" : "log-right-partner";
    } else {
      colorSuffix = side === "left" ? "log-left" : "log-right";
    }
  } else if (typeForColor === "skip") {
    colorSuffix = "skip";
  }

  const segmentsHTML = Array(5)
    .fill("")
    .map((_, index) => {
      let classList = "fuel-segment";
      let inlineStyle = "";
      if (colorSuffix !== "none") {
        if (restState.isFadingOut) {
          classList += ` is-fading-out-${colorSuffix}`;
          const elapsed = Date.now() - restState.animationStartTime;
          inlineStyle = `style="animation-delay: -${elapsed}ms;"`;
        } else if (restState.completedSegments[index]) {
          classList += ` is-complete-${colorSuffix}`;
        }
        if (restState.animatingSegments[index]) {
          classList += ` is-stamping-${colorSuffix}`;
        }
      }
      if (activeSegmentIndex === index) {
        classList += " is-active";
        const delayStyle = `style="animation-delay: -${
          (300 - restState.timeRemaining) % 60
        }s;"`;
        return `<div class="${classList}"><div class="segment-progress" ${delayStyle}></div></div>`;
      }
      return `<div class="${classList}" ${inlineStyle}></div>`;
    })
    .join("");

  const fuelGaugeHTML = `<div class="fuel-gauge-container">${segmentsHTML}</div>`;

  // Add "Recovering" overlay for log rest states (like normal mode)
  if (restState.type === "log") {
    return `
      <div class="fuel-gauge-with-overlay">
        ${fuelGaugeHTML}
        <div class="dual-mode-recovering-overlay">
          <p class="dual-mode-recovering-text"><span class="truncate-text">Recovering</span></p>
        </div>
      </div>
    `;
  }

  return fuelGaugeHTML;
}
