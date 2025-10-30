/* ==========================================================================
   LOGIN PAGE - Reset Password Handler

   Handles password reset modal and email sending:
   - Show/hide reset password modal
   - Send reset password email via Supabase
   - Rate limiting (3 attempts per 60 seconds)
   - Countdown timer when rate limited

   Rate Limiting:
   - Uses sessionStorage to persist across page refreshes
   - 3 attempts allowed per 60-second window
   - Shows countdown timer when rate limited
   - Automatic reset after 60 seconds

   Modal Interactions:
   - "Forgot Password?" link → show modal
   - "Cancel" button → hide modal
   - Backdrop click → hide modal
   - "Send Reset Link" → send email (if not rate limited)

   Dependencies: authService, validation, buttonstate
   Used by: login-page.index.js (attachEventListeners)
   ========================================================================== */

import { resetPasswordForEmail } from "services/authService.js";
import { showButtonError, showChecking, clearChecking, showSuccess } from "./login-page.buttonstate.js";
import { AUTH_ERROR_DURATION, AUTH_SUCCESS_DURATION } from "./login-page.constants.js";

// Rate limiting constants
const RESET_RATE_LIMIT_KEY = "resetPasswordAttempts";
const RESET_RATE_LIMIT_TIMESTAMP_KEY = "resetPasswordLimitTimestamp";
const MAX_RESET_ATTEMPTS = 3;
const RATE_LIMIT_DURATION_MS = 60000; // 60 seconds

/**
 * Attach reset password modal event listeners
 * @param {HTMLElement} forgotPasswordLink - "Forgot Password?" link element
 * @param {HTMLElement} resetModal - Reset password modal container
 * @param {HTMLInputElement} resetEmailInput - Email input in reset modal
 * @param {HTMLElement} resetSendBtn - "Send Reset Link" button
 * @param {HTMLElement} resetCancelBtn - "Cancel" button
 * @param {HTMLInputElement} emailInput - Main login email input (for pre-fill)
 */
export function attachResetPasswordHandlers(
  forgotPasswordLink,
  resetModal,
  resetEmailInput,
  resetSendBtn,
  resetCancelBtn,
  emailInput
) {
  if (!forgotPasswordLink || !resetModal) {
    console.error("Reset password elements not found");
    return;
  }

  // Show reset modal
  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    resetModal.classList.remove("is-hidden");
    resetEmailInput.value = emailInput.value; // Pre-fill with login email if available

    // Check rate limit status when modal opens
    checkResetRateLimit(resetSendBtn);
  });

  // Hide reset modal (Cancel button)
  resetCancelBtn.addEventListener("click", () => {
    resetModal.classList.add("is-hidden");
  });

  // Close modal when clicking backdrop
  const resetBackdrop = document.getElementById("reset-modal-backdrop");
  if (resetBackdrop) {
    resetBackdrop.addEventListener("click", () => {
      resetModal.classList.add("is-hidden");
    });
  }

  // Send reset link
  resetSendBtn.addEventListener("click", async () => {
    // Check if rate limited
    if (isResetRateLimited()) {
      return; // Button should already be disabled and showing countdown
    }

    const resetEmail = resetEmailInput.value.trim();

    if (!resetEmail) {
      showButtonError(resetSendBtn, "Enter\nEmail");
      return;
    }

    // Skip client-side email validation - let Supabase handle it
    // This catches invalid domains like "gmail.com1" that pass basic regex

    showChecking(resetSendBtn, "Sending...");
    const { error } = await resetPasswordForEmail(resetEmail);

    if (error) {
      clearChecking(resetSendBtn);
      // Increment attempt counter
      incrementResetAttempts();

      // Check if error is due to invalid email format
      if (error.toLowerCase().includes("invalid") || error.toLowerCase().includes("email")) {
        showButtonError(resetSendBtn, "Invalid\nEmail");
      } else {
        showButtonError(resetSendBtn, "Send\nFailed");
      }

      // Check if rate limit reached after error
      setTimeout(() => {
        checkResetRateLimit(resetSendBtn);
      }, AUTH_ERROR_DURATION); // After error animation completes
    } else {
      clearChecking(resetSendBtn);
      // Increment attempt counter on success too
      incrementResetAttempts();
      showSuccess(resetSendBtn, "Check\nEmail!");

      // Close modal and check rate limit
      setTimeout(() => {
        resetModal.classList.add("is-hidden");
        // Reset button to original state
        resetSendBtn.innerHTML = '<span class="button-text-wrap">Send<br>Reset Link</span>';
        resetSendBtn.disabled = false;
        resetSendBtn.style.filter = "";
        resetSendBtn.style.opacity = "";
        resetSendBtn.style.backgroundColor = "";
        // Clear email input
        resetEmailInput.value = "";

        // Check if rate limit reached
        checkResetRateLimit(resetSendBtn);
      }, AUTH_SUCCESS_DURATION);
    }
  });
}

/**
 * Increment reset password attempt counter
 * @private
 */
function incrementResetAttempts() {
  const currentAttempts = parseInt(sessionStorage.getItem(RESET_RATE_LIMIT_KEY) || "0");
  const newAttempts = currentAttempts + 1;
  sessionStorage.setItem(RESET_RATE_LIMIT_KEY, newAttempts.toString());

  // If we just hit the limit, store the timestamp
  if (newAttempts >= MAX_RESET_ATTEMPTS) {
    sessionStorage.setItem(RESET_RATE_LIMIT_TIMESTAMP_KEY, Date.now().toString());
  }
}

/**
 * Check if user is currently rate limited
 * @private
 * @returns {boolean} True if rate limited
 */
function isResetRateLimited() {
  const attempts = parseInt(sessionStorage.getItem(RESET_RATE_LIMIT_KEY) || "0");

  if (attempts < MAX_RESET_ATTEMPTS) {
    return false;
  }

  const limitTimestamp = parseInt(sessionStorage.getItem(RESET_RATE_LIMIT_TIMESTAMP_KEY) || "0");
  const elapsedTime = Date.now() - limitTimestamp;

  // Check if 60 seconds have passed
  if (elapsedTime >= RATE_LIMIT_DURATION_MS) {
    // Reset the counter
    sessionStorage.removeItem(RESET_RATE_LIMIT_KEY);
    sessionStorage.removeItem(RESET_RATE_LIMIT_TIMESTAMP_KEY);
    return false;
  }

  return true;
}

/**
 * Get remaining time in seconds until rate limit expires
 * @private
 * @returns {number} Seconds remaining
 */
function getRateLimitRemainingSeconds() {
  const limitTimestamp = parseInt(sessionStorage.getItem(RESET_RATE_LIMIT_TIMESTAMP_KEY) || "0");
  const elapsedTime = Date.now() - limitTimestamp;
  const remainingTime = RATE_LIMIT_DURATION_MS - elapsedTime;
  return Math.ceil(remainingTime / 1000);
}

/**
 * Check rate limit and update button state
 * Shows countdown timer if rate limited
 * @private
 * @param {HTMLElement} button - Reset button element
 */
function checkResetRateLimit(button) {
  if (!button) return;

  if (isResetRateLimited()) {
    // Show countdown
    updateRateLimitCountdown(button);
  } else {
    // Clear any existing countdown interval
    if (button.rateLimitInterval) {
      clearInterval(button.rateLimitInterval);
      button.rateLimitInterval = null;
    }
  }
}

/**
 * Update button with countdown timer
 * @private
 * @param {HTMLElement} button - Reset button element
 */
function updateRateLimitCountdown(button) {
  if (!button) return;

  // Clear any existing interval
  if (button.rateLimitInterval) {
    clearInterval(button.rateLimitInterval);
  }

  // Function to update the button text
  const updateButton = () => {
    if (!isResetRateLimited()) {
      // Time expired - restore button
      clearInterval(button.rateLimitInterval);
      button.rateLimitInterval = null;
      button.innerHTML = '<span class="button-text-wrap">Send<br>Reset Link</span>';
      button.disabled = false;
      button.style.filter = "";
      button.style.opacity = "";
      return;
    }

    const seconds = getRateLimitRemainingSeconds();
    button.innerHTML = `<span class="button-text-wrap">Resting For:<br>${seconds}s</span>`;
    button.disabled = true;
    // Keep muted appearance during rate limit
    button.style.filter = "";
    button.style.opacity = "";
  };

  // Update immediately
  updateButton();

  // Update every second
  button.rateLimitInterval = setInterval(updateButton, 1000);
}
