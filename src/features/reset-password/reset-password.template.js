/* ==========================================================================
   RESET PASSWORD PAGE - HTML Template

   Password reset form shown after user clicks email link from Supabase.
   User is auto-authenticated via token in URL, just needs to enter new password.

   Architecture: Centered card with password inputs
   - New password field
   - Confirm password field
   - Update button
   - Success/error messages
   - Auto-redirect to login on success

   Dependencies: None (pure template)
   Used by: reset-password.index.js
   ========================================================================== */

export function getResetPasswordTemplate() {
  return `
    <div class="reset-password-page">
      <div class="reset-password-card card">
        <div class="card-content-container">
          <h1 class="reset-password-title">Reset Password</h1>
          <p class="reset-password-description">Enter your new password below.</p>

          <div class="reset-password-form">
            <div class="reset-password-input-group">
              <label for="new-password" class="reset-password-label">New Password</label>
              <input
                type="password"
                id="new-password"
                class="reset-password-input"
                placeholder="••••••••"
                autocomplete="new-password"
                minlength="6"
                required
              />
            </div>

            <div class="reset-password-input-group">
              <label for="confirm-password" class="reset-password-label">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                class="reset-password-input"
                placeholder="••••••••"
                autocomplete="new-password"
                minlength="6"
                required
              />
            </div>

            <div id="reset-password-error" class="reset-password-error is-hidden"></div>

            <button
              type="button"
              id="reset-password-btn"
              class="action-button button-log reset-password-button"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>

      <div class="reset-password-footer">
        <p class="reset-password-footer-text">
          <a href="/index.html" class="reset-password-back-link">← Back to Login</a>
        </p>
      </div>
    </div>
  `;
}
