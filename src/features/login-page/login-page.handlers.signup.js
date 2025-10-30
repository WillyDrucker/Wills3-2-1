/* ==========================================================================
   LOGIN PAGE - Sign Up Handler

   Handles new user registration with existing account detection:
   1. Validate email and password fields
   2. Show "Checking..." state
   3. Attempt sign-in (check if user exists with correct password)
   4. If user exists → trigger Log In button with success flow
   5. If user doesn't exist → attempt sign-up
   6. Verify password after signup (security check)
   7. Show appropriate success/error state

   Complex Flow Handling:
   - User exists + correct password → "Already Registered!" → trigger Log In
   - User exists + wrong password → "Wrong Password" error
   - New user → "Creating..." → Email verification → "Check Email!"

   Password Verification:
   After successful signup, we sign out and re-authenticate to verify
   the password is correct. This prevents Supabase from bypassing
   password validation on existing accounts.

   Dependencies: authService, validation, buttonstate
   Used by: login-page.index.js (attachEventListeners)
   ========================================================================== */

import { signIn, signUp, signOut } from "services/authService.js";
import { isValidEmail, hasRequiredFields } from "./login-page.validation.js";
import {
  showButtonError,
  showChecking,
  clearChecking,
  showSuccess,
  showSuccessMuted,
  muteButton,
  unmuteButton,
} from "./login-page.buttonstate.js";
import { AUTH_CHECK_DURATION, AUTH_SUCCESS_DURATION, AUTH_TRANSITION_DURATION } from "./login-page.constants.js";

/**
 * Attach sign-up button event listener
 * @param {HTMLElement} signUpBtn - Sign Up button element
 * @param {HTMLElement} signInBtn - Sign In button element (for muting/triggering)
 * @param {HTMLInputElement} emailInput - Email input element
 * @param {HTMLInputElement} passwordInput - Password input element
 */
export function attachSignUpHandler(signUpBtn, signInBtn, emailInput, passwordInput) {
  signUpBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validation - show errors in button
    if (!hasRequiredFields(email, password)) {
      showButtonError(signUpBtn, "Fill In\nAll Fields");
      return;
    }

    if (!isValidEmail(email)) {
      showButtonError(signUpBtn, "Invalid\nEmail");
      return;
    }

    if (password.length < 6) {
      showButtonError(signUpBtn, "Min 6\nCharacters");
      return;
    }

    // STEP 1: Show neutral "Checking..." state with gray background
    showChecking(signUpBtn, "Checking...");
    muteButton(signInBtn); // Mute Log In button while Sign Up is checking

    await new Promise(resolve => setTimeout(resolve, AUTH_CHECK_DURATION));
    const { user: existingUser, error: signInError } = await signIn(email, password);

    if (existingUser) {
      // User exists and password is CORRECT - show message, then "Logging In...", then trigger Log In button
      clearChecking(signUpBtn);
      showSuccessMuted(signUpBtn, "Already\nRegistered!"); // Muted during wait
      setTimeout(() => {
        // Change Sign Up button to "Logging In..."
        showSuccessMuted(signUpBtn, "Logging In..."); // Muted during wait
        setTimeout(() => {
          // Activate Log In button to show "Logged In!" then trigger app
          unmuteButton(signInBtn); // Unmute Log In button
          showSuccess(signInBtn, "Logged In!");
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("auth-success"));
          }, AUTH_SUCCESS_DURATION);
        }, AUTH_TRANSITION_DURATION);
      }, AUTH_TRANSITION_DURATION);
      return;
    }

    // STEP 2: Sign in failed - either user doesn't exist OR wrong password
    // Try to create account
    clearChecking(signUpBtn);
    showChecking(signUpBtn, "Creating...");
    const { user, error } = await signUp(email, password);

    if (error) {
      // Signup failed - most likely user exists but wrong password was provided
      clearChecking(signUpBtn);
      if (error.includes("already registered") || error.includes("already exists") || error.includes("User already registered")) {
        showButtonError(signUpBtn, "Already\nRegistered", () => {
          // Unmute Log In button after error animation completes
          unmuteButton(signInBtn);
        });
      } else {
        showButtonError(signUpBtn, "Sign Up\nFailed", () => {
          // Unmute Log In button after error animation completes
          unmuteButton(signInBtn);
        });
      }
    } else if (user) {
      // Signup succeeded - Supabase auto-signed the user in
      // CRITICAL: We must verify the password is correct by signing out and re-authenticating
      // This prevents Supabase from bypassing password validation on existing accounts

      await signOut();
      clearChecking(signUpBtn);
      showChecking(signUpBtn, "Verifying...");

      const { user: verifyUser, error: verifyError } = await signIn(email, password);

      if (verifyError || !verifyUser) {
        // Password verification FAILED - either new account with wrong initial signin, or wrong password on existing account
        // Check if account is confirmed (existing) vs pending (new)
        const isAlreadyConfirmed = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;

        if (isAlreadyConfirmed) {
          // Existing confirmed account - wrong password provided
          clearChecking(signUpBtn);
          showButtonError(signUpBtn, "Wrong\nPassword", () => {
            // Unmute Log In button after error animation completes
            unmuteButton(signInBtn);
          });
        } else {
          // New account created, but sign-in failed (shouldn't happen, but handle gracefully)
          clearChecking(signUpBtn);
          unmuteButton(signInBtn); // Unmute Log In button
          showSuccess(signUpBtn, "Check\nEmail!");
        }
      } else {
        // Password verification SUCCEEDED
        // Check if this was an existing account or new account
        const isAlreadyConfirmed = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;

        if (isAlreadyConfirmed) {
          // Existing account - user provided correct password - show message, then "Logging In...", then trigger Log In button
          clearChecking(signUpBtn);
          showSuccessMuted(signUpBtn, "Already\nRegistered!"); // Muted during wait
          setTimeout(() => {
            // Change Sign Up button to "Logging In..."
            showSuccessMuted(signUpBtn, "Logging In..."); // Muted during wait
            setTimeout(() => {
              // Activate Log In button to show "Logged In!" then trigger app
              unmuteButton(signInBtn); // Unmute Log In button
              showSuccess(signInBtn, "Logged In!");
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent("auth-success"));
              }, AUTH_SUCCESS_DURATION);
            }, AUTH_TRANSITION_DURATION);
          }, AUTH_TRANSITION_DURATION);
        } else {
          // New account created successfully
          clearChecking(signUpBtn);
          unmuteButton(signInBtn); // Unmute Log In button
          showSuccess(signUpBtn, "Check\nEmail!");
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("auth-success"));
          }, AUTH_SUCCESS_DURATION);
        }
      }
    }
  });
}
