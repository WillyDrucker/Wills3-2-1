/* ==========================================================================
   PROFILE PAGE - Nickname Handler

   Handles nickname input with debounced auto-save and 8 character limit.
   Updates both Supabase user_metadata (authenticated) and localStorage (all users).

   Features:
   - 500ms debounce prevents excessive saves while typing
   - Real-time character limit validation (8 max)
   - Auto-save to Supabase for authenticated users
   - Always saves to localStorage for persistence
   - Success feedback with auto-hide after 2 seconds

   Dependencies: authService, persistenceService, appState
   Used by: profile-page.index.js (attachEventListeners)
   ========================================================================== */

import { updateUserMetadata } from "services/authService.js";
import { saveState } from "services/core/persistenceService.js";
import { appState } from "state";

/**
 * Attach nickname input event listener with debounced auto-save
 * @param {HTMLInputElement} nicknameInput - Nickname input element
 * @param {HTMLElement} nicknameFeedback - Feedback message element
 */
export function attachNicknameHandler(nicknameInput, nicknameFeedback) {
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
}
