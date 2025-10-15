/* ==========================================================================
   RESET PASSWORD PAGE - Business Logic

   Handles password reset after user clicks email link.
   User is auto-authenticated by Supabase via token in URL.

   Flow:
   1. User clicks reset link in email
   2. Supabase auto-authenticates via URL token
   3. Page renders password reset form
   4. User enters new password
   5. Password updated via updateUser()
   6. Redirect to login page

   Security: User must be authenticated via email token to access page.
   Password validation requires min 6 characters and matching passwords.

   Dependencies: authService, getResetPasswordTemplate
   Used by: reset-password.html (standalone page)
   ========================================================================== */

import { updatePassword, getSession } from "services/authService.js";
import { getResetPasswordTemplate } from "./reset-password.template.js";

/**
 * Initialize reset password page
 */
async function init() {
  const container = document.getElementById("reset-password-page");

  if (!container) {
    console.error("Reset password container not found");
    return;
  }

  // DEV MODE: Allow testing without email token
  const urlParams = new URLSearchParams(window.location.search);
  const devMode = urlParams.get('dev') === 'true';

  if (!devMode) {
    // Check if user is authenticated (via email token)
    const { session } = await getSession();

    if (!session) {
      // No session - redirect to login
      console.error("Not authenticated - redirecting to login");
      window.location.href = "/index.html";
      return;
    }
  }

  // Render page
  container.innerHTML = getResetPasswordTemplate();
  attachEventListeners();
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  const newPasswordInput = document.getElementById("new-password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const resetBtn = document.getElementById("reset-password-btn");
  const errorDiv = document.getElementById("reset-password-error");

  if (!newPasswordInput || !confirmPasswordInput || !resetBtn) {
    console.error("Reset password: Required elements not found");
    return;
  }

  // Update password button
  resetBtn.addEventListener("click", async () => {
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // Validation
    if (!newPassword || !confirmPassword) {
      showButtonError(resetBtn, "Fill In All Fields");
      return;
    }

    if (newPassword.length < 6) {
      showButtonError(resetBtn, "Min 6 Characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      showButtonError(resetBtn, "Passwords Don't Match");
      return;
    }

    // Security check: Verify session exists before updating password
    const { session } = await getSession();

    if (!session) {
      showButtonError(resetBtn, "Authentication Required");
      return;
    }

    // Update password
    showLoading(resetBtn, "Updating...");
    const { error } = await updatePassword(newPassword);

    if (error) {
      hideLoading(resetBtn, "Update Password");
      showButtonError(resetBtn, "Update Failed");
    } else {
      hideLoading(resetBtn, "Success! Redirecting...");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 2000);
    }
  });

  // Enter key submits
  confirmPasswordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      resetBtn.click();
    }
  });
}

/**
 * Show error in button with red flash animation
 * Matches active-exercise card input validation flash (3 pulses, 1700ms total)
 */
function showButtonError(button, message) {
  if (!button) return;

  // Save original state
  const originalDisabled = button.disabled;

  // Show error message and disable button
  button.textContent = message;
  button.disabled = true;

  // Override disabled state filters to show true colors during animation
  button.style.filter = "none";
  button.style.opacity = "1";

  // Add CSS animation class (3 pulses, 0.56s each = 1.68s total)
  button.classList.add("button-is-flashing");

  // Remove class and restore state after animation completes (1700ms)
  setTimeout(() => {
    button.classList.remove("button-is-flashing");
    button.textContent = "Update Password";
    button.style.filter = ""; // Restore default filter
    button.style.opacity = ""; // Restore default opacity
    button.disabled = originalDisabled;
  }, 1700);
}

/**
 * Show loading state on button
 */
function showLoading(button, text) {
  if (button) {
    button.textContent = text;
    button.disabled = true;
    button.classList.add("button-loading");
  }
}

/**
 * Hide loading state on button
 */
function hideLoading(button, originalText) {
  if (button) {
    button.textContent = originalText;
    button.disabled = false;
    button.classList.remove("button-loading");
  }
}

// Initialize on page load
init();
