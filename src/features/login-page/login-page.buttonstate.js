/* ==========================================================================
   LOGIN PAGE - Button State Management

   Manages visual states for auth buttons during async operations:
   - Error state with red flash animation
   - Checking/loading state with gray background
   - Success state with full opacity
   - Muted state for disabled buttons
   - Button text restoration

   Button State Flow:
   1. User clicks button → showChecking (gray, "Checking...")
   2. Auth call completes:
      - Success → showSuccess (full color, success message)
      - Error → showButtonError (red flash animation, error message)
   3. Animation completes → restore original button text

   Dependencies: None (pure DOM manipulation)
   Used by: login-page.handlers.* (all auth handlers)
   ========================================================================== */

/**
 * Show error in button with red flash animation and stacked text
 * Matches reset password page implementation (3 pulses, 1680ms total)
 * @param {HTMLElement} button - Button element to show error on
 * @param {string} message - Error message (use \n for line breaks)
 * @param {Function} onComplete - Optional callback after animation completes
 */
export function showButtonError(button, message, onComplete) {
  if (!button) return;

  // Show error message with line breaks (e.g., "Invalid\nCredentials" displays stacked)
  button.innerHTML = message.replace(/\n/g, '<br>');
  button.disabled = true;

  // Override disabled state filters to show true colors during animation
  button.style.filter = "none";
  button.style.opacity = "1";

  // Add CSS animation class (3 pulses, 560ms each = 1680ms total)
  button.classList.add("button-is-flashing");

  // Remove class and restore state after animation completes (1700ms)
  setTimeout(() => {
    button.classList.remove("button-is-flashing");

    // Restore original button text based on button ID
    restoreButtonText(button);

    button.style.filter = ""; // Restore default filter
    button.style.opacity = ""; // Restore default opacity
    button.style.backgroundColor = ""; // Clear any background color
    button.disabled = false; // Re-enable button (no muted state)

    // Call callback if provided
    if (onComplete) {
      onComplete();
    }
  }, 1700);
}

/**
 * Show neutral "Checking..." state with gray background
 * Used during authentication before success/error is known
 * Note: Only changes background - text color remains at full opacity
 * @param {HTMLElement} button - Button element
 * @param {string} text - Text to display (supports \n line breaks)
 */
export function showChecking(button, text) {
  button.innerHTML = text.replace(/\n/g, '<br>');
  button.disabled = true;
  // Apply gray background via inline style (overrides button colors)
  button.style.backgroundColor = "var(--surface-dark)";
  // Override disabled button muting - maintain full color/opacity
  button.style.filter = "none";
  button.style.opacity = "1";
}

/**
 * Clear checking state (remove gray background)
 * @param {HTMLElement} button - Button element
 */
export function clearChecking(button) {
  button.style.backgroundColor = "";
  button.style.filter = "";
  button.style.opacity = "";
}

/**
 * Show success state on button (no muted colors, just display text)
 * @param {HTMLElement} button - Button element
 * @param {string} text - Success text to display (supports \n line breaks)
 */
export function showSuccess(button, text) {
  button.innerHTML = text.replace(/\n/g, '<br>');
  button.disabled = true;
  // Override disabled button muting - maintain full color/opacity
  button.style.filter = "none";
  button.style.opacity = "1";
}

/**
 * Show success state on button with muted appearance
 * Used during waiting states like "Already Registered!" or "Logging In..."
 * @param {HTMLElement} button - Button element
 * @param {string} text - Text to display (supports \n line breaks)
 */
export function showSuccessMuted(button, text) {
  button.innerHTML = text.replace(/\n/g, '<br>');
  button.disabled = true;
  // Allow normal disabled button muting (brightness 0.5, saturate 0.5, opacity 0.7)
  button.style.filter = "";
  button.style.opacity = "";
  button.style.backgroundColor = "";
}

/**
 * Mute button (apply disabled state styling)
 * @param {HTMLElement} button - Button element
 */
export function muteButton(button) {
  button.disabled = true;
  // Allow CSS disabled styling to apply
  button.style.filter = "";
  button.style.opacity = "";
}

/**
 * Unmute button (remove disabled state, clear overrides)
 * @param {HTMLElement} button - Button element
 */
export function unmuteButton(button) {
  button.disabled = false;
  button.style.filter = "";
  button.style.opacity = "";
  button.style.backgroundColor = "";
}

/**
 * Restore original button text based on button ID
 * @private
 * @param {HTMLElement} button - Button element
 */
function restoreButtonText(button) {
  if (button.id === "login-signin-btn") {
    button.textContent = "Log In";
  } else if (button.id === "login-signup-btn") {
    button.textContent = "Sign Up";
  } else if (button.id === "reset-send-btn") {
    button.innerHTML = '<span class="button-text-wrap">Send<br>Reset Link</span>';
  }
}
