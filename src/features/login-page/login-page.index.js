/* ==========================================================================
   LOGIN PAGE - Business Logic

   Renders login page and handles authentication actions:
   - Sign in (email + password)
   - Sign up (create new account)
   - Continue as guest (bypass auth)
   - Error display and validation

   🔒 CEMENT: Login-first architecture
   - Login page shown before main app loads
   - Guest mode available for quick access
   - Authenticated users get data sync

   Dependencies: ui, authService, getLoginPageTemplate
   Used by: main.js (initial load), authService (redirect after logout)
   ========================================================================== */

import { ui } from "ui";
import { signIn, signUp, signOut, continueAsGuest, resetPasswordForEmail } from "services/authService.js";
import { getLoginPageTemplate } from "./login-page.template.js";

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
 * Attach event listeners to login form elements
 */
function attachEventListeners() {
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const signInBtn = document.getElementById("login-signin-btn");
  const signUpBtn = document.getElementById("login-signup-btn");
  const guestBtn = document.getElementById("login-guest-btn");
  const errorDiv = document.getElementById("login-error");

  if (!emailInput || !passwordInput || !signInBtn || !signUpBtn || !guestBtn) {
    console.error("Login page: Required elements not found");
    return;
  }

  // Sign In button
  signInBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!validateInputs(email, password, errorDiv)) return;

    showLoading(signInBtn, "Signing in...");
    const { user, error } = await signIn(email, password);

    if (error) {
      showError(errorDiv, error);
      hideLoading(signInBtn, "Sign In");
    } else {
      // Success - auth state updated, trigger app load
      hideError(errorDiv);
      window.dispatchEvent(new CustomEvent("auth-success"));
    }
  });

  // Sign Up button
  signUpBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!validateInputs(email, password, errorDiv)) return;

    // STEP 1: Check if user exists by attempting sign in first
    showLoading(signUpBtn, "Checking...");
    const { user: existingUser, error: signInError } = await signIn(email, password);

    if (existingUser) {
      // User exists and password is CORRECT - just sign them in
      showSuccess(errorDiv, "This email is already registered. You've been signed in!");
      hideLoading(signUpBtn, "Sign Up");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("auth-success"));
      }, 1500);
      return;
    }

    // STEP 2: Sign in failed - either user doesn't exist OR wrong password
    // Try to create account
    showLoading(signUpBtn, "Creating account...");
    const { user, error } = await signUp(email, password);

    if (error) {
      // Signup failed - most likely user exists but wrong password was provided
      if (error.includes("already registered") || error.includes("already exists") || error.includes("User already registered")) {
        showError(errorDiv, "This email is already registered. Please use 'Sign In' with the correct password.");
      } else {
        showError(errorDiv, error);
      }
      hideLoading(signUpBtn, "Sign Up");
    } else if (user) {
      // Signup succeeded - Supabase auto-signed the user in
      // CRITICAL: We must verify the password is correct by signing out and re-authenticating
      // This prevents Supabase from bypassing password validation on existing accounts

      await signOut();
      showLoading(signUpBtn, "Verifying credentials...");

      const { user: verifyUser, error: verifyError } = await signIn(email, password);

      if (verifyError || !verifyUser) {
        // Password verification FAILED - either new account with wrong initial signin, or wrong password on existing account
        // Check if account is confirmed (existing) vs pending (new)
        const isAlreadyConfirmed = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;

        if (isAlreadyConfirmed) {
          // Existing confirmed account - wrong password provided
          showError(errorDiv, "This email is already registered. Please use 'Sign In' with the correct password.");
          hideLoading(signUpBtn, "Sign Up");
        } else {
          // New account created, but sign-in failed (shouldn't happen, but handle gracefully)
          showSuccess(errorDiv, "Account created! Check your email to confirm, then sign in.");
          hideLoading(signUpBtn, "Sign Up");
        }
      } else {
        // Password verification SUCCEEDED
        // Check if this was an existing account or new account
        const isAlreadyConfirmed = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;

        if (isAlreadyConfirmed) {
          // Existing account - user provided correct password
          showSuccess(errorDiv, "This email is already registered. You've been signed in!");
        } else {
          // New account created successfully
          showSuccess(errorDiv, "Account created! Check your email to confirm.");
        }

        hideLoading(signUpBtn, "Sign Up");
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("auth-success"));
        }, 1500);
      }
    }
  });

  // Guest button
  guestBtn.addEventListener("click", () => {
    continueAsGuest();
    window.dispatchEvent(new CustomEvent("auth-success"));
  });

  // Forgot Password link and modal handlers
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const resetModal = document.getElementById("reset-password-modal");
  const resetEmailInput = document.getElementById("reset-email");
  const resetSendBtn = document.getElementById("reset-send-btn");
  const resetCancelBtn = document.getElementById("reset-cancel-btn");
  const resetErrorDiv = document.getElementById("reset-error");

  if (forgotPasswordLink && resetModal) {
    // Show reset modal
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      resetModal.classList.remove("is-hidden");
      resetEmailInput.value = emailInput.value; // Pre-fill with login email if available
      hideError(resetErrorDiv);
    });

    // Hide reset modal
    resetCancelBtn.addEventListener("click", () => {
      resetModal.classList.add("is-hidden");
      hideError(resetErrorDiv);
    });

    // Send reset link
    resetSendBtn.addEventListener("click", async () => {
      const resetEmail = resetEmailInput.value.trim();

      if (!resetEmail) {
        showError(resetErrorDiv, "Please enter your email address");
        return;
      }

      if (!isValidEmail(resetEmail)) {
        showError(resetErrorDiv, "Please enter a valid email address");
        return;
      }

      showLoading(resetSendBtn, "Sending...");
      const { error } = await resetPasswordForEmail(resetEmail);

      if (error) {
        showError(resetErrorDiv, error);
        hideLoading(resetSendBtn, "Send Reset Link");
      } else {
        hideError(resetErrorDiv);
        showSuccess(resetErrorDiv, "Check your email for the reset link!");
        hideLoading(resetSendBtn, "Send Reset Link");

        // Close modal after 2 seconds
        setTimeout(() => {
          resetModal.classList.add("is-hidden");
          hideError(resetErrorDiv);
        }, 2000);
      }
    });
  }

  // Enter key submits (sign in)
  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      signInBtn.click();
    }
  });
}

/**
 * Validate email and password inputs
 */
function validateInputs(email, password, errorDiv) {
  if (!email) {
    showError(errorDiv, "Please enter your email address");
    return false;
  }

  if (!isValidEmail(email)) {
    showError(errorDiv, "Please enter a valid email address");
    return false;
  }

  if (!password) {
    showError(errorDiv, "Please enter your password");
    return false;
  }

  if (password.length < 6) {
    showError(errorDiv, "Password must be at least 6 characters");
    return false;
  }

  hideError(errorDiv);
  return true;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Show error message
 */
function showError(errorDiv, message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove("is-hidden");
  errorDiv.classList.add("login-error-visible");
}

/**
 * Hide error message
 */
function hideError(errorDiv) {
  errorDiv.classList.add("is-hidden");
  errorDiv.classList.remove("login-error-visible");
}

/**
 * Show success message
 */
function showSuccess(errorDiv, message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove("is-hidden", "login-error-visible");
  errorDiv.classList.add("login-success");
}

/**
 * Show loading state on button
 */
function showLoading(button, text) {
  button.textContent = text;
  button.disabled = true;
  button.classList.add("button-loading");
}

/**
 * Hide loading state on button
 */
function hideLoading(button, text) {
  button.textContent = text;
  button.disabled = false;
  button.classList.remove("button-loading");
}
