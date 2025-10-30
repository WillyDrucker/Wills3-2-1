/* ==========================================================================
   LOGIN PAGE - Sign In Handler

   Handles email/password sign-in authentication flow:
   1. Validate email and password fields
   2. Show "Checking..." state
   3. Call authService.signIn()
   4. Show success or error state
   5. Trigger app load on success

   Button State Flow:
   - Checking (500ms) → Success ("Logged In!" 600ms → trigger app)
   - Checking (500ms) → Error (red flash 1680ms → restore)

   Dependencies: authService, validation, buttonstate
   Used by: login-page.index.js (attachEventListeners)
   ========================================================================== */

import { signIn } from "services/authService.js";
import { isValidEmail, hasRequiredFields } from "./login-page.validation.js";
import {
  showButtonError,
  showChecking,
  clearChecking,
  showSuccess,
  muteButton,
  unmuteButton,
} from "./login-page.buttonstate.js";
import { AUTH_CHECK_DURATION, AUTH_SUCCESS_DURATION } from "./login-page.constants.js";

/**
 * Attach sign-in button event listener
 * @param {HTMLElement} signInBtn - Sign In button element
 * @param {HTMLElement} signUpBtn - Sign Up button element (for muting)
 * @param {HTMLInputElement} emailInput - Email input element
 * @param {HTMLInputElement} passwordInput - Password input element
 */
export function attachSignInHandler(signInBtn, signUpBtn, emailInput, passwordInput) {
  signInBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validation - show errors in button
    if (!hasRequiredFields(email, password)) {
      showButtonError(signInBtn, "Fill In\nAll Fields");
      return;
    }

    if (!isValidEmail(email)) {
      showButtonError(signInBtn, "Invalid\nEmail");
      return;
    }

    if (password.length < 6) {
      showButtonError(signInBtn, "Min 6\nCharacters");
      return;
    }

    // Show neutral "Checking..." state with gray background
    showChecking(signInBtn, "Checking...");
    muteButton(signUpBtn); // Mute Sign Up button while Log In is checking

    await new Promise(resolve => setTimeout(resolve, AUTH_CHECK_DURATION));
    const { user, error } = await signIn(email, password);

    if (error) {
      // Error - show red flash with error message
      clearChecking(signInBtn);
      showButtonError(signInBtn, "Invalid\nCredentials", () => {
        // Unmute Sign Up button after error animation completes
        unmuteButton(signUpBtn);
      });
    } else {
      // Success - show "Logged In!" state, then trigger app load
      clearChecking(signInBtn);
      showSuccess(signInBtn, "Logged In!");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("auth-success"));
      }, AUTH_SUCCESS_DURATION);
    }
  });
}
