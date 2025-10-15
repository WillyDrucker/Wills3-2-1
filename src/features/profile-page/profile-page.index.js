/* ==========================================================================
   PROFILE PAGE - Business Logic

   Renders profile page and handles profile management actions:
   - Display user email
   - Update nickname (8 character max, auto-saved)
   - Change password (with current password verification)
   - Sign out

   Password change requires current password verification for security.
   New password must match confirmation and be minimum 6 characters.

   Nickname features 500ms debounced auto-save with 8 character max.
   Authenticated users save to Supabase user_metadata, guests to localStorage.

   Dependencies: ui, authService, getProfilePageTemplate, persistenceService
   Used by: actionService (goToProfile), main.js (page navigation)
   ========================================================================== */

import { ui } from "ui";
import { signIn, updatePassword, updateUserMetadata } from "services/authService.js";
import { appState } from "state";
import { getProfilePageTemplate } from "./profile-page.template.js";
import { saveState } from "services/core/persistenceService.js";

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
  const nicknameInput = document.getElementById("profile-nickname");
  const currentPasswordInput = document.getElementById("profile-current-password");
  const newPasswordInput = document.getElementById("profile-new-password");
  const confirmPasswordInput = document.getElementById("profile-confirm-password");
  const updateBtn = document.getElementById("profile-update-btn");
  const errorDiv = document.getElementById("profile-error");
  const successDiv = document.getElementById("profile-success");

  if (!nicknameInput || !currentPasswordInput || !newPasswordInput || !confirmPasswordInput || !updateBtn) {
    console.error("Profile page: Required elements not found");
    return;
  }

  // Nickname input - debounced auto-save on change
  const nicknameFeedback = document.getElementById("nickname-feedback");
  let nicknameTimeout;

  nicknameInput.addEventListener("input", () => {
    const nickname = nicknameInput.value.trim();

    // Clear previous timeout
    if (nicknameTimeout) {
      clearTimeout(nicknameTimeout);
    }

    // Hide feedback while typing
    if (nicknameFeedback) {
      nicknameFeedback.classList.add("is-hidden");
    }

    // Validate length in real-time
    if (nickname.length > 8) {
      if (nicknameFeedback) {
        nicknameFeedback.textContent = "Maximum 8 characters";
        nicknameFeedback.classList.remove("profile-success");
        nicknameFeedback.classList.add("profile-error");
        nicknameFeedback.classList.remove("is-hidden");
      }
      return;
    }

    // Debounce for 500ms before saving
    nicknameTimeout = setTimeout(async () => {
      if (nickname && nickname.length <= 8) {
        // Update appState
        if (appState.auth && appState.auth.user) {
          appState.auth.user.nickname = nickname;

          // Save to Supabase if authenticated (not guest)
          if (appState.auth.isAuthenticated) {
            const { error } = await updateUserMetadata({ nickname });

            if (error) {
              if (nicknameFeedback) {
                nicknameFeedback.textContent = "Failed to save nickname";
                nicknameFeedback.classList.remove("profile-success");
                nicknameFeedback.classList.add("profile-error");
                nicknameFeedback.classList.remove("is-hidden");
              }
              return;
            }
          }

          // Save to localStorage
          saveState();

          // Show success feedback
          if (nicknameFeedback) {
            nicknameFeedback.textContent = "✓ Nickname saved";
            nicknameFeedback.classList.remove("profile-error");
            nicknameFeedback.classList.add("profile-success");
            nicknameFeedback.classList.remove("is-hidden");

            // Hide after 2 seconds
            setTimeout(() => {
              nicknameFeedback.classList.add("is-hidden");
            }, 2000);
          }
        }
      } else if (!nickname) {
        // Empty nickname - clear from state
        if (appState.auth && appState.auth.user) {
          appState.auth.user.nickname = null;
          saveState();
        }
      }
    }, 500);
  });

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
