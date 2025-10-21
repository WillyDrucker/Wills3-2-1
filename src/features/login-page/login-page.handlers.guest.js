/* ==========================================================================
   LOGIN PAGE - Guest Mode Handler

   Handles guest mode bypass authentication:
   1. Update button text to "Logged In As Guest"
   2. Maintain yellow "Guest" text highlight
   3. Call continueAsGuest() to set guest mode in appState
   4. Trigger app load after 1000ms

   Guest Mode Features:
   - No authentication required
   - Uses localStorage only (no database sync)
   - Full app functionality available
   - Can upgrade to authenticated account later

   Dependencies: authService
   Used by: login-page.index.js (attachEventListeners)
   ========================================================================== */

import { continueAsGuest } from "services/authService.js";

/**
 * Attach guest button event listener
 * @param {HTMLElement} guestBtn - Guest button element
 */
export function attachGuestHandler(guestBtn) {
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
}
