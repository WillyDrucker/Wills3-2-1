import { appState } from "state";

export function getAnchorAreaHTML() {
  return appState.superset.isActive || appState.partner.isActive
    ? getDualModeAnchorAreaHTML()
    : getNormalFuelGaugeHTML();
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
  return `<div class="dual-fuel-gauge-container"><div class="fuel-gauge-wrapper" style="flex:1;">${leftHTML}</div><div class="fuel-gauge-wrapper" style="flex:1;">${rightHTML}</div></div>`;
}

function getNormalFuelGaugeHTML() {
  const restState = appState.rest.normal;
  const activeSegmentIndex =
    restState.type !== "none" ? restState.completedSegments.indexOf(false) : -1;
  const typeForColor = restState.isFadingOut
    ? restState.finalAnimationType
    : restState.type;
  const segmentsHTML = Array(5)
    .fill("")
    .map((_, index) => {
      let classList = "fuel-segment";
      let inlineStyle = "";
      if (typeForColor !== "none") {
        if (restState.isFadingOut) {
          classList +=
            typeForColor === "log"
              ? " is-fading-out-log-left"
              : " is-fading-out-skip";
          const elapsed = Date.now() - restState.animationStartTime;
          inlineStyle = `style="animation-delay: -${elapsed}ms;"`;
        } else if (restState.completedSegments[index]) {
          classList +=
            typeForColor === "log"
              ? " is-complete-log-left"
              : " is-complete-skip";
        }
        if (restState.animatingSegments[index]) {
          classList +=
            typeForColor === "log"
              ? " is-stamping-log-left"
              : " is-stamping-skip";
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
  return `<div class="fuel-gauge-container">${segmentsHTML}</div>`;
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
  return `<div class="fuel-gauge-container">${segmentsHTML}</div>`;
}
