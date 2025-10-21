/* ==========================================================================
   PROFILE PAGE - Password Change Handler

   Handles password update with current password verification.
   Validates new password meets requirements before submitting.

   Security Flow:
   1. Validate inputs (current password, new password, confirmation)
   2. Verify current password by attempting sign-in
   3. Update to new password via Supabase
   4. Clear form on success

   Validation Rules:
   - Current password required
   - New password minimum 6 characters
   - New password must differ from current
   - New password must match confirmation

   Dependencies: authService, appState
   Used by: profile-page.index.js (attachEventListeners)
   ========================================================================== */

import { signIn, updatePassword } from "services/authService.js";
import { appState } from "state";

/**
 * Attach password change button event listener
 * @param {HTMLElement} updateBtn - Update Password button
 * @param {HTMLInputElement} currentPasswordInput - Current password input
 * @param {HTMLInputElement} newPasswordInput - New password input
 * @param {HTMLInputElement} confirmPasswordInput - Confirm password input
 * @param {HTMLElement} errorDiv - Error message container
 * @param {HTMLElement} successDiv - Success message container
 */
export function attachPasswordHandler(
  updateBtn,
  currentPasswordInput,
  newPasswordInput,
  confirmPasswordInput,
  errorDiv,
  successDiv
) {
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
      hideLoading(updateBtn);
      return;
    }

    const { error: signInError } = await signIn(userEmail, currentPassword);

    if (signInError) {
      showError(errorDiv, successDiv, "Current password is incorrect");
      hideLoading(updateBtn);
      return;
    }

    // Current password verified, update to new password
    showLoading(updateBtn, "Updating password...");
    const { error: updateError } = await updatePassword(newPassword);

    if (updateError) {
      showError(errorDiv, successDiv, updateError);
      hideLoading(updateBtn);
    } else {
      // Success
      hideError(errorDiv, successDiv);
      showSuccess(errorDiv, successDiv, "Password updated successfully!");
      hideLoading(updateBtn);

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
 * @private
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
 * @private
 */
function showError(errorDiv, successDiv, message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove("is-hidden");
  successDiv.classList.add("is-hidden");
}

/**
 * Hide error message
 * @private
 */
function hideError(errorDiv, successDiv) {
  errorDiv.classList.add("is-hidden");
  successDiv.classList.add("is-hidden");
}

/**
 * Show success message
 * @private
 */
function showSuccess(errorDiv, successDiv, message) {
  successDiv.textContent = message;
  successDiv.classList.remove("is-hidden");
  errorDiv.classList.add("is-hidden");
}

/**
 * Show loading state on button
 * @private
 */
function showLoading(button, text) {
  button.innerHTML = text;
  button.disabled = true;
  button.classList.add("button-loading");
}

/**
 * Hide loading state on button
 * @private
 */
function hideLoading(button) {
  // Restore original button structure for Update Password button
  if (button.id === "profile-update-btn") {
    button.innerHTML = '<span>Update</span><span>Password</span>';
  }
  button.disabled = false;
  button.classList.remove("button-loading");
}
