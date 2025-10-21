/* ==========================================================================
   PROFILE PAGE - Main Coordinator

   Renders profile page and coordinates handler modules for:
   - Nickname management (debounced auto-save, 8 char max)
   - Password change (current password verification required)

   Handler Modules:
   - Nickname: Auto-save with debounce, Supabase + localStorage sync
   - Password: Validation + current password verification

   Dependencies: ui, getProfilePageTemplate, handler modules
   Used by: actionService (goToProfile), main.js (page navigation)
   ========================================================================== */

import { ui } from "ui";
import { getProfilePageTemplate } from "./profile-page.template.js";
import { attachNicknameHandler } from "./profile-page.handlers.nickname.js";
import { attachPasswordHandler } from "./profile-page.handlers.password.js";

/**
 * Render profile page
 */
export function renderProfilePage() {
  ui.mainContent.innerHTML = getProfilePageTemplate();
  attachEventListeners();
}

/**
 * Attach all event listeners to profile page elements
 * @private
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

  // Nickname handler
  const nicknameFeedback = document.getElementById("nickname-feedback");
  attachNicknameHandler(nicknameInput, nicknameFeedback);

  // Password change handler
  attachPasswordHandler(
    updateBtn,
    currentPasswordInput,
    newPasswordInput,
    confirmPasswordInput,
    errorDiv,
    successDiv
  );
}
