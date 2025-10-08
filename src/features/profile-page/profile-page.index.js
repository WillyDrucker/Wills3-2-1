/* ==========================================================================
   PROFILE PAGE - Business Logic

   Renders profile page and handles profile management actions:
   - Display user email
   - Change password (with current password verification)
   - Sign out

   🔒 CEMENT: Password change requires verification
   - Current password required (security best practice)
   - New password must match confirmation
   - Minimum 6 characters
   - Success message on completion

   Dependencies: ui, authService, getProfilePageTemplate
   Used by: actionService (goToProfile), main.js (page navigation)
   ========================================================================== */

import { ui } from "ui";
import { signIn, updatePassword } from "services/authService.js";
import { appState } from "state";
import { getProfilePageTemplate } from "./profile-page.template.js";

/**
 * Render profile page
 */
export function renderProfilePage() {
  ui.mainContent.innerHTML = getProfilePageTemplate();
  attachEventListeners();
}

/**
 * Attach event listeners to profile page elements
 */
function attachEventListeners() {
  const currentPasswordInput = document.getElementById("profile-current-password");
  const newPasswordInput = document.getElementById("profile-new-password");
  const confirmPasswordInput = document.getElementById("profile-confirm-password");
  const updateBtn = document.getElementById("profile-update-btn");
  const errorDiv = document.getElementById("profile-error");
  const successDiv = document.getElementById("profile-success");

  if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput || !updateBtn) {
    console.error("Profile page: Required elements not found");
    return;
  }

  // Update Password button
  updateBtn.addEventListener("click", async () => {
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!validatePasswordChange(currentPassword, newPassword, confirmPassword, errorDiv, successDiv)) {
      return;
    }

    // Verify current password by attempting to sign in
    showLoading(updateBtn, "Verifying...");
    const userEmail = appState.auth?.user?.email;

    if (!userEmail) {
      showError(errorDiv, successDiv, "User email not found. Please sign in again.");
      hideLoading(updateBtn, "Update Password");
      return;
    }

    const { error: signInError } = await signIn(userEmail, currentPassword);

    if (signInError) {
      showError(errorDiv, successDiv, "Current password is incorrect");
      hideLoading(updateBtn, "Update Password");
      return;
    }

    // Current password verified, update to new password
    showLoading(updateBtn, "Updating password...");
    const { error: updateError } = await updatePassword(newPassword);

    if (updateError) {
      showError(errorDiv, successDiv, updateError);
      hideLoading(updateBtn, "Update Password");
    } else {
      // Success
      hideError(errorDiv, successDiv);
      showSuccess(errorDiv, successDiv, "Password updated successfully!");
      hideLoading(updateBtn, "Update Password");

      // Clear form
      currentPasswordInput.value = "";
      newPasswordInput.value = "";
      confirmPasswordInput.value = "";
    }
  });

  // Enter key submits (update password)
  confirmPasswordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      updateBtn.click();
    }
  });
}

/**
 * Validate password change inputs
 */
function validatePasswordChange(currentPassword, newPassword, confirmPassword, errorDiv, successDiv) {
  if (!currentPassword) {
    showError(errorDiv, successDiv, "Please enter your current password");
    return false;
  }

  if (!newPassword) {
    showError(errorDiv, successDiv, "Please enter a new password");
    return false;
  }

  if (newPassword.length < 6) {
    showError(errorDiv, successDiv, "New password must be at least 6 characters");
    return false;
  }

  if (newPassword === currentPassword) {
    showError(errorDiv, successDiv, "New password must be different from current password");
    return false;
  }

  if (newPassword !== confirmPassword) {
    showError(errorDiv, successDiv, "New passwords do not match");
    return false;
  }

  hideError(errorDiv, successDiv);
  return true;
}

/**
 * Show error message
 */
function showError(errorDiv, successDiv, message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove("is-hidden");
  successDiv.classList.add("is-hidden");
}

/**
 * Hide error message
 */
function hideError(errorDiv, successDiv) {
  errorDiv.classList.add("is-hidden");
  successDiv.classList.add("is-hidden");
}

/**
 * Show success message
 */
function showSuccess(errorDiv, successDiv, message) {
  successDiv.textContent = message;
  successDiv.classList.remove("is-hidden");
  errorDiv.classList.add("is-hidden");
}

/**
 * Show loading state on button
 */
function showLoading(button, text) {
  button.innerHTML = text;
  button.disabled = true;
  button.classList.add("button-loading");
}

/**
 * Hide loading state on button
 */
function hideLoading(button, text) {
  // Restore original button structure for Update Password button
  if (button.id === "profile-update-btn") {
    button.innerHTML = '<span>Update</span><span>Password</span>';
  } else {
    button.innerHTML = text;
  }
  button.disabled = false;
  button.classList.remove("button-loading");
}
