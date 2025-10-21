/* ==========================================================================
   LOGIN PAGE - HTML Template

   Generates login/signup page HTML with email/password authentication and
   guest mode option. Designed to accommodate future OAuth providers (Google).

   Architecture: Single centered card with three sections
   - Email/Password inputs
   - Sign In / Sign Up buttons
   - Guest mode bypass option
   - Error message display area
   - Future: OAuth provider buttons (Google, etc.)

   Dependencies: None (pure template)
   Used by: login-page.index.js (renderLoginPage)
   ========================================================================== */

export function getLoginPageTemplate() {
  return `
    <div class="login-page">
      <div class="login-card card">
        <div class="card-content-container">
          <h1 class="login-title">Will's 3-2-1</h1>

          <div class="login-form">
            <div class="login-input-group">
              <label for="login-email" class="login-label">Email</label>
              <input
                type="email"
                id="login-email"
                class="login-input"
                placeholder="your@email.com"
                autocomplete="email"
                required
              />
            </div>

            <div class="login-input-group">
              <label for="login-password" class="login-label">Password</label>
              <input
                type="password"
                id="login-password"
                class="login-input"
                placeholder="••••••••"
                autocomplete="current-password"
                minlength="6"
                required
              />
              <a href="#" id="forgot-password-link" class="forgot-password-link">Forgot Password?</a>
            </div>

            <div class="login-button-group">
              <button
                type="button"
                id="login-signup-btn"
                class="action-button button-secondary"
              >
                Sign Up
              </button>
              <button
                type="button"
                id="login-signin-btn"
                class="action-button button-log"
              >
                Log In
              </button>
            </div>

            <div class="login-divider">
              <span class="login-divider-text">OR</span>
            </div>

            <button
              type="button"
              id="login-guest-btn"
              class="action-button button-guest"
            >
              🔓&nbsp;Continue As&nbsp;<span class="guest-highlight">Guest</span>
            </button>

            <!-- Future: OAuth providers -->
            <!--
            <div class="login-divider">
              <span class="login-divider-text">OR</span>
            </div>
            <button type="button" class="action-button button-oauth-google">
              Sign in with Google
            </button>
            -->
          </div>
        </div>
      </div>

      <div class="login-footer">
        <p class="login-footer-text">
          Guest mode uses local storage only. Create an account to sync across devices.
        </p>
      </div>

      <!-- Password Reset Modal -->
      <div id="reset-password-modal" class="login-reset-modal-container is-hidden">
        <div class="superset-modal-backdrop" id="reset-modal-backdrop"></div>
        <div class="superset-modal-content card confirmation-modal-card login-reset-card">
          <h2 class="confirmation-modal-title">Reset Link</h2>
          <p class="confirmation-modal-description">Enter your email address and we'll send you a link to reset your password.</p>

          <div class="reset-input-group">
            <label for="reset-email" class="confirmation-modal-question">Email</label>
            <input
              type="email"
              id="reset-email"
              class="reset-input login-input"
              placeholder="your@email.com"
              autocomplete="email"
              required
            />
          </div>

          <div id="reset-error" class="login-error is-hidden"></div>

          <div class="confirmation-modal-actions">
            <button type="button" id="reset-cancel-btn" class="action-button button-cancel">Cancel</button>
            <button type="button" id="reset-send-btn" class="action-button button-log"><span class="button-text-wrap">Send<br>Reset Link</span></button>
          </div>
        </div>
      </div>
    </div>
  `;
}
