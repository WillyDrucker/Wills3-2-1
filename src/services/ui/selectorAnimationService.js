/* ==========================================================================
   SELECTOR ANIMATION SERVICE - Centralized selector animation logic

   Provides reusable functions for animating selectors with grow/glow effects.
   Handles multi-segment text with different color transitions.

   Color transitions supported:
   - Green: text-plan → olive → green (with green glow)
   - Yellow: text-warning → olive → yellow (with yellow glow)
   - Blue: text-primary → olive → blue (with blue glow)
   - Olive: text-deviation → olive (with olive glow, stays olive)

   Dependencies: None (pure animation logic)
   Used by: actionHandlers, modal handlers
   ========================================================================== */

/**
 * Maps color classes to their corresponding transition animation classes
 */
const COLOR_TRANSITION_MAP = {
  'text-plan': 'is-transitioning-to-green',
  'text-warning': 'is-transitioning-to-yellow',
  'text-primary': 'is-transitioning-to-blue',
  'text-deviation': 'is-transitioning-to-olive'
};

/**
 * Animates a selector with grow and color/glow transitions
 *
 * @param {string} selectorId - DOM ID of the selector to animate
 * @param {Object} options - Animation options
 * @param {number} [options.duration=1000] - Animation duration in ms
 * @param {Function} [options.onComplete] - Callback after animation completes
 */
export function animateSelector(selectorId, options = {}) {
  const { duration = 1000, onComplete } = options;

  const selectorContainer = document.querySelector(`#${selectorId}`);
  if (!selectorContainer) {
    // Call callback even if selector not found (for completion tracking)
    if (onComplete) onComplete();
    return;
  }

  // Find all animation targets within the selector
  const animationTargets = selectorContainer.querySelectorAll('[data-animation-target]');
  if (animationTargets.length === 0) {
    // Call callback even if no targets (for completion tracking)
    if (onComplete) onComplete();
    return;
  }

  // Apply grow animation to entire selector
  selectorContainer.classList.add("is-animating-selector");

  // Animate each colored text segment
  const cleanupTasks = [];

  animationTargets.forEach(target => {
    // Determine current color class and corresponding transition
    const currentColorClass = Array.from(target.classList)
      .find(cls => COLOR_TRANSITION_MAP[cls]);

    if (!currentColorClass) return;

    const transitionClass = COLOR_TRANSITION_MAP[currentColorClass];
    const finalColorClass = currentColorClass;

    // Store cleanup task for this target
    cleanupTasks.push({
      target,
      transitionClass,
      finalColorClass
    });

    // Start from olive for consistent animation (except olive stays olive)
    if (currentColorClass !== 'text-deviation') {
      target.classList.remove('text-plan', 'text-warning', 'text-primary');
      target.classList.add('text-deviation');
    }

    // Apply color transition (runs in parallel with grow)
    target.classList.add(transitionClass);
  });

  // Clean up after animations complete
  setTimeout(() => {
    selectorContainer.classList.remove("is-animating-selector");

    cleanupTasks.forEach(({ target, transitionClass, finalColorClass }) => {
      target.classList.remove(transitionClass);
      // Restore final color
      target.classList.remove('text-deviation', 'text-plan', 'text-warning', 'text-primary');
      target.classList.add(finalColorClass);
    });

    // Clear will-change to prevent rendering issues
    selectorContainer.style.willChange = 'auto';
    animationTargets.forEach(target => {
      target.style.willChange = 'auto';
    });

    // Execute callback if provided
    if (onComplete) {
      onComplete();
    }
  }, duration);
}

/**
 * Animates multiple selectors simultaneously
 * Useful for animating both Current Plan and Current Focus together
 *
 * @param {string[]} selectorIds - Array of selector IDs to animate
 * @param {Object} options - Animation options (same as animateSelector)
 */
export function animateSelectors(selectorIds, options = {}) {
  const { onComplete, ...otherOptions } = options;

  // Track completion count to only fire callback once
  let completedCount = 0;
  const totalCount = selectorIds.length;

  selectorIds.forEach(id => {
    animateSelector(id, {
      ...otherOptions,
      onComplete: () => {
        completedCount++;
        // Only fire the callback after ALL selectors complete
        if (completedCount === totalCount && onComplete) {
          onComplete();
        }
      }
    });
  });
}

/**
 * Triggers the "Let's Go!" button green pulsing border animation
 * Animation runs continuously (infinite) until manually stopped
 * Synced with workout log "is-next-up" pulse animation (4s cycle)
 *
 * @param {Object} appState - Application state for tracking pulse status
 */
export function triggerLetsGoButtonPulse(appState) {
  const button = document.querySelector('[data-action="toggleConfigHeader"].confirm-button');
  if (!button) {
    // Don't set flag if button doesn't exist
    return false;
  }

  // Check if already pulsing - don't retrigger (prevents animation restart)
  if (button.classList.contains('is-pulsing-action')) {
    // Sync flag with actual state
    if (appState) {
      appState.ui.isLetsGoButtonPulsing = true;
    }
    return true; // Already pulsing
  }

  // Add pulsing class (animation is infinite, will keep pulsing)
  button.classList.add('is-pulsing-action');

  // Track that pulse is active ONLY after successfully applying class
  if (appState) {
    appState.ui.isLetsGoButtonPulsing = true;
  }

  return true;
}

/**
 * Stops the "Let's Go!" button pulsing animation
 *
 * @param {Object} appState - Application state for tracking pulse status
 */
export function stopLetsGoButtonPulse(appState) {
  const button = document.querySelector('[data-action="toggleConfigHeader"].confirm-button');
  if (!button) return;

  // Track that pulse is stopped
  if (appState) {
    appState.ui.isLetsGoButtonPulsing = false;
  }

  button.classList.remove('is-pulsing-action');
}

/**
 * Restores the "Let's Go!" button pulse after DOM re-render
 * Used after operations that replace the button element (like session cycling)
 *
 * @param {Object} appState - Application state for checking pulse status
 */
export function restoreLetsGoButtonPulse(appState) {
  if (!appState || !appState.ui.isLetsGoButtonPulsing) return false;

  const button = document.querySelector('[data-action="toggleConfigHeader"].confirm-button');
  if (!button) {
    // Button doesn't exist yet, reset flag so it can be triggered again
    appState.ui.isLetsGoButtonPulsing = false;
    return false;
  }

  // Check if class already exists - if so, animation is running, don't retrigger
  if (button.classList.contains('is-pulsing-action')) {
    return true; // Already pulsing, nothing to do
  }

  // Restore pulsing class if it was active before DOM update
  button.classList.add('is-pulsing-action');
  return true;
}
