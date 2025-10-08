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

   🔒 CEMENT: Security
   - User must be authenticated (via email token) to access this page
   - Password must be min 6 characters
   - Passwords must match
   - Auto-redirect to login on success or if not authenticated

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
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validation
    if (!newPassword || !confirmPassword) {
      showError(errorDiv, "Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      showError(errorDiv, "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError(errorDiv, "Passwords do not match");
      return;
    }

    // Security check: Verify session exists before updating password
    const { session } = await getSession();
    console.log("🔒 Session check:", session ? "AUTHENTICATED" : "NOT AUTHENTICATED");

    if (!session) {
      showError(errorDiv, "Authentication required. Please use the reset link from your email.");
      return;
    }

    // Update password
    showLoading(resetBtn, "Updating...");
    const { error } = await updatePassword(newPassword);

    if (error) {
      showError(errorDiv, error);
      hideLoading(resetBtn, "Update Password");
    } else {
      hideError(errorDiv);
      showSuccess(errorDiv, "Password updated successfully! Redirecting to login...");
      hideLoading(resetBtn, "Update Password");

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
 * Show error message
 */
function showError(errorDiv, message) {
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove("is-hidden", "reset-password-success");
    errorDiv.classList.add("reset-password-error");
  }
}

/**
 * Hide error message
 */
function hideError(errorDiv) {
  if (errorDiv) {
    errorDiv.classList.add("is-hidden");
  }
}

/**
 * Show success message
 */
function showSuccess(errorDiv, message) {
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove("is-hidden", "reset-password-error");
    errorDiv.classList.add("reset-password-success");
  }
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
