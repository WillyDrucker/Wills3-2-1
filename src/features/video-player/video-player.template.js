/* ==========================================================================
   VIDEO PLAYER - HTML Template

   Generates video player modal HTML with YouTube iframe container, countdown
   overlay, and close button. Returns empty string when not visible.

   Architecture: Full-screen modal with vertical video aspect ratio
   ├── Modal container (full screen overlay)
   ├── Backdrop (click to close)
   ├── Video wrapper (9:16 aspect ratio, 85vh height)
   │   ├── YouTube player container (iframe target)
   │   └── Countdown overlay (shown on video end)
   └── Close button (positioned top-right)

   Dependencies: appState (isVisible, videoId, countdown state)
   Used by: video-player.index.js (renderVideoPlayer)
   ========================================================================== */

import { appState } from "state";

export function getVideoPlayerTemplate() {
  const {
    isVisible,
    videoId,
    isCountdownActive,
    countdownLine1,
    countdownLine2,
  } = appState.ui.videoPlayer;

  if (!isVisible) return "";

  const countdownOverlay = isCountdownActive
    ? `<div class="video-countdown-overlay">
         <h2 class="countdown-title">${countdownLine1}</h2>
         <h2 class="countdown-timer">${countdownLine2}</h2>
       </div>`
    : "";

  return `
      <div class="video-modal-container is-hidden">
        <div class="video-player-backdrop" data-action="closeVideo"></div>
        <div class="video-content-wrapper">
          <div class="video-wrapper">
            ${videoId ? '<div id="youtube-player-container"></div>' : ""}
            ${countdownOverlay}
          </div>
          <div class="video-close-button" data-action="closeVideo">×</div>
        </div>
      </div>
    `;
}
