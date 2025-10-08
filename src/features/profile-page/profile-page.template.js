/* ==========================================================================
   PROFILE PAGE - HTML Template

   Generates profile management page HTML for authenticated users to:
   - View their email
   - Change their password
   - Manage account settings

   Architecture: Centered card with profile information and password change form
   - Email display (read-only)
   - Current password verification
   - New password input with confirmation
   - Update/Cancel buttons

   Dependencies: appState (auth.user.email)
   Used by: profile-page.index.js (renderProfilePage)
   ========================================================================== */

import { appState } from "state";

export function getProfilePageTemplate() {
  const userEmail = appState.auth?.user?.email || "Not logged in";

  return `
    <div class="card profile-page-card">
      <div class="card-content-container">
        <h2 class="card-header">Profile Settings</h2>

        <div class="profile-section">
          <h3 class="profile-section-title">Account Information</h3>

          <div class="profile-info-group">
            <label class="profile-label">Email</label>
            <div class="profile-email-display">${userEmail}</div>
          </div>
        </div>

        <div class="profile-section">
          <h3 class="profile-section-title">Change Password</h3>

          <div class="profile-form">
            <div class="profile-input-group">
              <label for="profile-current-password" class="profile-label">Current Password</label>
              <input
                type="password"
                id="profile-current-password"
                class="profile-input"
                placeholder="Enter current password"
                autocomplete="current-password"
                required
              />
            </div>

            <div class="profile-input-group">
              <label for="profile-new-password" class="profile-label">New Password</label>
              <input
                type="password"
                id="profile-new-password"
                class="profile-input"
                placeholder="Enter new password (min 6 characters)"
                autocomplete="new-password"
                minlength="6"
                required
              />
            </div>

            <div class="profile-input-group">
              <label for="profile-confirm-password" class="profile-label">Confirm New Password</label>
              <input
                type="password"
                id="profile-confirm-password"
                class="profile-input"
                placeholder="Confirm new password"
                autocomplete="new-password"
                minlength="6"
                required
              />
            </div>

            <div id="profile-error" class="profile-error is-hidden"></div>
            <div id="profile-success" class="profile-success is-hidden"></div>

            <div class="profile-button-group">
              <button
                type="button"
                id="profile-cancel-btn"
                class="action-button button-cancel"
                data-action="goHome"
              >
                Cancel
              </button>
              <button
                type="button"
                id="profile-update-btn"
                class="action-button button-log profile-update-btn"
              >
                <span>Update</span>
                <span>Password</span>
              </button>
            </div>
          </div>
        </div>

        <div class="profile-section">
          <h3 class="profile-section-title">Account Actions</h3>
          <div class="profile-button-group">
            <button
              type="button"
              class="action-button button-cancel"
              data-action="signOut"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
