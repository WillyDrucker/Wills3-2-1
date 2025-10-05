/* ==========================================================================
   VIDEO PLAYER - Business Logic

   Full-screen YouTube video modal with countdown timer and mobile performance
   optimizations. Manages YouTube IFrame API lifecycle, screen orientation,
   focus trap, and auto-close countdown on video end.

   🔒 CEMENT: Mobile performance optimizations
   - YouTube player configured with medium quality for mobile performance
   - Direct DOM manipulation for countdown updates (prevents re-render lag)
   - Hardware acceleration hints in CSS for smooth video rendering
   - Fullscreen disabled (using custom UI)

   🔒 CEMENT: Screen orientation management
   - Unlocks orientation on video open (allows landscape viewing)
   - Locks orientation on video close (restores app orientation)

   Dependencies: appState, ui, focusTrapService, screenOrientation, utils,
                 getVideoPlayerTemplate
   Used by: actionService (showVideo, closeVideo), main.js
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getVideoPlayerTemplate } from "./video-player.template.js";
import { loadScriptOnce, getYouTubeVideoId } from "utils";
import {
  lockScreenOrientation,
  unlockScreenOrientation,
} from "lib/screenOrientation.js";
import * as focusTrapService from "lib/focusTrap.js";

let ytPlayer;
const YOUTUBE_API_SRC = "https://www.youtube.com/iframe_api";

window.onYouTubeIframeAPIReady = function () {
  appState.ui.videoPlayer.isApiReady = true;

  if (appState.ui.videoPlayer.isVisible && appState.ui.videoPlayer.videoId) {
    createPlayer(appState.ui.videoPlayer.videoId);
  }
};

export async function handleShowVideo(videoUrl) {
  if (appState.ui.videoPlayer.isVisible) return;
  appState.ui.modal.elementToFocusOnClose = document.activeElement;
  document.documentElement.classList.add("is-modal-open");

  unlockScreenOrientation();
  const videoId = getYouTubeVideoId(videoUrl);
  if (!videoId) return;

  appState.ui.videoPlayer.isVisible = true;
  appState.ui.videoPlayer.videoId = videoId;
  renderVideoPlayer();

  try {
    await loadScriptOnce(YOUTUBE_API_SRC);
    if (appState.ui.videoPlayer.isApiReady) {
      createPlayer(videoId);
    }
  } catch (error) {
    console.error("Failed to load the YouTube IFrame API script.", error);
  }
}

function createPlayer(videoId) {
  if (
    typeof YT === "undefined" ||
    !document.getElementById("youtube-player-container")
  ) {
    return;
  }

  if (ytPlayer && typeof ytPlayer.destroy === "function") {
    ytPlayer.destroy();
  }

  ytPlayer = new YT.Player("youtube-player-container", {
    height: "100%",
    width: "100%",
    videoId: videoId,
    playerVars: {
      autoplay: 1,
      mute: 1,
      playsinline: 1,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      enablejsapi: 1,        // 🔒 CEMENT: Enhanced API control for mobile optimization
      iv_load_policy: 3,     // Hide annotations to reduce processing overhead
      fs: 0,                 // Disable fullscreen (using custom UI)
      vq: 'medium',          // Limit video quality for mobile performance
    },
    events: {
      onReady: (event) => {
        event.target.playVideo();
        setTimeout(() => {
          const videoModal = document.querySelector(".video-modal-container");
          if (videoModal) focusTrapService.activate(videoModal);
        }, 100);
      },
      onStateChange: onPlayerStateChange,
    },
  });
}

export function handleCloseVideo() {
  if (!appState.ui.videoPlayer.isVisible) return;

  cancelPlayerCountdown();
  if (ytPlayer && typeof ytPlayer.destroy === "function") {
    ytPlayer.destroy();
    ytPlayer = null;
  }

  appState.ui.videoPlayer.isVisible = false;
  appState.ui.videoPlayer.videoId = null;
  renderVideoPlayer();

  lockScreenOrientation();

  focusTrapService.deactivate();
  document.documentElement.classList.remove("is-modal-open");
  appState.ui.modal.elementToFocusOnClose?.focus();
  appState.ui.modal.elementToFocusOnClose = null;
}

export function renderVideoPlayer() {
  ui.videoPlayerModalContainer.innerHTML = getVideoPlayerTemplate();
  const container = document.querySelector(".video-modal-container");
  if (container) {
    container.classList.toggle("is-hidden", !appState.ui.videoPlayer.isVisible);
  }
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    startPlayerCountdown();
  } else if (appState.ui.videoPlayer.isCountdownActive) {
    cancelPlayerCountdown();
  }
}

function startPlayerCountdown() {
  const { videoPlayer } = appState.ui;
  cancelPlayerCountdown();

  videoPlayer.isCountdownActive = true;
  videoPlayer.countdownLine1 = "Returning To:";
  videoPlayer.countdownLine2 = "";
  renderVideoPlayer();

  const sequence = [
    { delay: 1000, value: "Will's" },
    { delay: 1000, value: "Will's 3-" },
    { delay: 1000, value: "Will's 3-2-" },
    { delay: 1000, value: "Will's 3-2-1" },
    { delay: 1000, action: handleCloseVideo },
  ];

  let accumulatedDelay = 0;
  sequence.forEach((step) => {
    accumulatedDelay += step.delay;
    const timerId = setTimeout(() => {
      if (!videoPlayer.isCountdownActive) return;
      if (step.action) {
        step.action();
      } else {
        // 🔒 CEMENT: Direct DOM manipulation optimization for mobile performance
        // Prevents full re-render during video playback to reduce lag on Android devices
        const countdownTimer = document.querySelector('.countdown-timer');
        if (countdownTimer) {
          countdownTimer.textContent = step.value;
        } else {
          // Fallback to full render if element not found
          videoPlayer.countdownLine2 = step.value;
          renderVideoPlayer();
        }
      }
    }, accumulatedDelay);
    videoPlayer.countdownTimerIds.push(timerId);
  });
}

function cancelPlayerCountdown() {
  const { videoPlayer } = appState.ui;
  videoPlayer.countdownTimerIds.forEach(clearTimeout);

  if (videoPlayer.isCountdownActive) {
    videoPlayer.isCountdownActive = false;
    videoPlayer.countdownLine1 = "";
    videoPlayer.countdownLine2 = "";
    videoPlayer.countdownTimerIds = [];
    renderVideoPlayer();
  }
}
