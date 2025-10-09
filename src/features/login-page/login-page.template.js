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
              <label class="login-label">Email</label>
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
              <label class="login-label">Password</label>
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

            <div id="login-error" class="login-error is-hidden"></div>

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
                Sign In
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
              🔓&nbsp;Continue as&nbsp;<span class="guest-highlight">Guest</span>
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
      <div id="reset-password-modal" class="reset-modal is-hidden">
        <div class="reset-modal-content card">
          <h2 class="reset-modal-title">Reset Password</h2>
          <p class="reset-modal-description">Enter your email address and we'll send you a link to reset your password.</p>

          <div class="reset-input-group">
            <label class="reset-label">Email</label>
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

          <div class="reset-button-group">
            <button type="button" id="reset-cancel-btn" class="action-button button-secondary">Cancel</button>
            <button type="button" id="reset-send-btn" class="action-button button-log">Send Reset Link</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
