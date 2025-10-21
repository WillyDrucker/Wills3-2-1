/* ==========================================================================
   LOGIN PAGE - Main Coordinator

   Renders login page and coordinates authentication handler modules.
   Login-first architecture shows login page before main app loads.

   Handler Modules:
   - Sign In: Email/password authentication
   - Sign Up: New account creation with existing account detection
   - Guest: Bypass authentication (localStorage only)
   - Reset Password: Send password reset email with rate limiting

   Architecture:
   - Single centered card with email/password inputs
   - Sign In / Sign Up buttons
   - Guest mode bypass option
   - Reset password modal
   - Enter key submits (sign in)

   Dependencies: ui, getLoginPageTemplate, handler modules
   Used by: main.js (initial load), authService (redirect after logout)
   ========================================================================== */

import { ui } from "ui";
import { getLoginPageTemplate } from "./login-page.template.js";
import { attachSignInHandler } from "./login-page.handlers.signin.js";
import { attachSignUpHandler } from "./login-page.handlers.signup.js";
import { attachGuestHandler } from "./login-page.handlers.guest.js";
import { attachResetPasswordHandlers } from "./login-page.handlers.resetpassword.js";

/**
 * Render login page
 * Clears all UI sections and shows only the login page
 */
export function renderLoginPage() {
  // Clear all UI sections (including header to hide home/hamburger icons)
  if (ui.appHeader) ui.appHeader.innerHTML = "";
  ui.configSection.innerHTML = "";
  ui.mainContent.innerHTML = "";
  ui.workoutFooter.innerHTML = "";

  // Render login page
  ui.mainContent.innerHTML = getLoginPageTemplate();
  attachEventListeners();
}

/**
 * Attach all event listeners to login form elements
 * @private
 */
function attachEventListeners() {
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const signInBtn = document.getElementById("login-signin-btn");
  const signUpBtn = document.getElementById("login-signup-btn");
  const guestBtn = document.getElementById("login-guest-btn");

  if (!emailInput || !passwordInput || !signInBtn || !signUpBtn || !guestBtn) {
    console.error("Login page: Required elements not found");
    return;
  }

  // Attach authentication handlers
  attachSignInHandler(signInBtn, signUpBtn, emailInput, passwordInput);
  attachSignUpHandler(signUpBtn, signInBtn, emailInput, passwordInput);
  attachGuestHandler(guestBtn);

  // Reset password modal handlers
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const resetModal = document.getElementById("reset-password-modal");
  const resetEmailInput = document.getElementById("reset-email");
  const resetSendBtn = document.getElementById("reset-send-btn");
  const resetCancelBtn = document.getElementById("reset-cancel-btn");

  if (forgotPasswordLink && resetModal) {
    attachResetPasswordHandlers(
      forgotPasswordLink,
      resetModal,
      resetEmailInput,
      resetSendBtn,
      resetCancelBtn,
      emailInput
    );
  }

  // Enter key submits (sign in)
  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      signInBtn.click();
    }
  });
}
