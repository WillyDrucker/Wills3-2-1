/* ==========================================================================
   LOGIN PAGE - Business Logic

   Renders login page and handles authentication actions:
   - Sign in (email + password)
   - Sign up (create new account)
   - Continue as guest (bypass auth)
   - Error display and validation

   Login-first architecture shows login page before main app loads.
   Guest mode available for quick access without account creation.

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

  if (!emailInput || !passwordInput || !signInBtn || !signUpBtn || !guestBtn) {
    console.error("Login page: Required elements not found");
    return;
  }

  // Log In button
  signInBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validation - show errors in button
    if (!email || !password) {
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

    // Show neutral "Checking..." state with gray background for 500ms
    showChecking(signInBtn, "Checking...");
    muteButton(signUpBtn); // Mute Sign Up button while Log In is checking

    await new Promise(resolve => setTimeout(resolve, 500));
    const { user, error } = await signIn(email, password);

    if (error) {
      // Error - show red flash with error message
      clearChecking(signInBtn);
      showButtonError(signInBtn, "Invalid\nCredentials", () => {
        // Unmute Sign Up button after error animation completes
        unmuteButton(signUpBtn);
      });
    } else {
      // Success - show "Logged In!" state for 1000ms, then trigger app load
      clearChecking(signInBtn);
      showSuccess(signInBtn, "Logged In!");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("auth-success"));
      }, 1000);
    }
  });

  // Sign Up button
  signUpBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validation - show errors in button
    if (!email || !password) {
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

    // STEP 1: Show neutral "Checking..." state with gray background for 500ms
    showChecking(signUpBtn, "Checking...");
    muteButton(signInBtn); // Mute Log In button while Sign Up is checking

    await new Promise(resolve => setTimeout(resolve, 500));
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
          }, 1000);
        }, 1000);
      }, 1500);
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
              }, 1000);
            }, 1000);
          }, 1500);
        } else {
          // New account created successfully
          clearChecking(signUpBtn);
          unmuteButton(signInBtn); // Unmute Log In button
          showSuccess(signUpBtn, "Check\nEmail!");
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("auth-success"));
          }, 1500);
        }
      }
    }
  });

  // Guest button
  guestBtn.addEventListener("click", () => {
    // Show "Logged In As Guest" with yellow "Guest" text (no muted state)
    guestBtn.innerHTML = 'Logged In As&nbsp;<span class="guest-highlight">Guest</span>';
    guestBtn.disabled = true;
    // Override disabled button muting - maintain full color/opacity
    guestBtn.style.filter = "none";
    guestBtn.style.opacity = "1";

    continueAsGuest();

    // Wait 1000ms before triggering auth-success
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("auth-success"));
    }, 1000);
  });

  // Forgot Password link and modal handlers
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const resetModal = document.getElementById("reset-password-modal");
  const resetEmailInput = document.getElementById("reset-email");
  const resetSendBtn = document.getElementById("reset-send-btn");
  const resetCancelBtn = document.getElementById("reset-cancel-btn");

  if (forgotPasswordLink && resetModal) {
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

    // Close modal when clicking outside content area (on overlay)
    resetModal.addEventListener("click", (e) => {
      // Only close if clicking directly on the modal overlay (not on the content)
      if (e.target === resetModal) {
        resetModal.classList.add("is-hidden");
      }
    });

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
        }, 1700); // After error animation completes
      } else {
        clearChecking(resetSendBtn);
        // Increment attempt counter on success too
        incrementResetAttempts();
        showSuccess(resetSendBtn, "Check\nEmail!");

        // Close modal after 2 seconds and check rate limit
        setTimeout(() => {
          resetModal.classList.add("is-hidden");
          // Reset button to original state
          resetSendBtn.textContent = "Send Reset Link";
          resetSendBtn.disabled = false;
          resetSendBtn.style.filter = "";
          resetSendBtn.style.opacity = "";
          resetSendBtn.style.backgroundColor = "";
          // Clear email input
          resetEmailInput.value = "";

          // Check if rate limit reached
          checkResetRateLimit(resetSendBtn);
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
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Show error in button with red flash animation and stacked text
 * Matches reset password page implementation (3 pulses, 1680ms total)
 * @param {HTMLElement} button - Button element to show error on
 * @param {string} message - Error message (use \n for line breaks)
 * @param {Function} onComplete - Optional callback after animation completes
 */
function showButtonError(button, message, onComplete) {
  if (!button) return;

  // Save original state
  const originalDisabled = button.disabled;

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
    if (button.id === "login-signin-btn") {
      button.textContent = "Log In";
    } else if (button.id === "login-signup-btn") {
      button.textContent = "Sign Up";
    } else if (button.id === "reset-send-btn") {
      button.textContent = "Send Reset Link";
    }
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
 */
function showChecking(button, text) {
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
 */
function clearChecking(button) {
  button.style.backgroundColor = "";
  button.style.filter = "";
  button.style.opacity = "";
}

/**
 * Show success state on button (no muted colors, just display text)
 */
function showSuccess(button, text) {
  button.innerHTML = text.replace(/\n/g, '<br>');
  button.disabled = true;
  // Override disabled button muting - maintain full color/opacity
  button.style.filter = "none";
  button.style.opacity = "1";
}

/**
 * Show success state on button with muted appearance
 * Used during waiting states like "Already Registered!" or "Logging In..."
 */
function showSuccessMuted(button, text) {
  button.innerHTML = text.replace(/\n/g, '<br>');
  button.disabled = true;
  // Allow normal disabled button muting (brightness 0.5, saturate 0.5, opacity 0.7)
  button.style.filter = "";
  button.style.opacity = "";
  button.style.backgroundColor = "";
}

/**
 * Mute button (apply disabled state styling)
 */
function muteButton(button) {
  button.disabled = true;
  // Allow CSS disabled styling to apply
  button.style.filter = "";
  button.style.opacity = "";
}

/**
 * Unmute button (remove disabled state, clear overrides)
 */
function unmuteButton(button) {
  button.disabled = false;
  button.style.filter = "";
  button.style.opacity = "";
  button.style.backgroundColor = "";
}

// === RESET PASSWORD RATE LIMITING ===
// Prevents abuse by limiting to 3 attempts per 60 seconds
// Uses sessionStorage to persist across page refreshes

const RESET_RATE_LIMIT_KEY = "resetPasswordAttempts";
const RESET_RATE_LIMIT_TIMESTAMP_KEY = "resetPasswordLimitTimestamp";
const MAX_RESET_ATTEMPTS = 3;
const RATE_LIMIT_DURATION_MS = 60000; // 60 seconds

/**
 * Increment reset password attempt counter
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
      button.textContent = "Send Reset Link";
      button.disabled = false;
      button.style.filter = "";
      button.style.opacity = "";
      return;
    }

    const seconds = getRateLimitRemainingSeconds();
    button.innerHTML = `Resting For:<br>${seconds}s`;
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
