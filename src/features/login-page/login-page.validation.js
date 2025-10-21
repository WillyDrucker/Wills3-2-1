/* ==========================================================================
   LOGIN PAGE - Validation Utilities

   Email and password validation logic for login/signup forms.
   Provides client-side validation before authentication attempts.

   Validation Rules:
   - Email: Basic regex pattern (presence of @ and domain)
   - Password: Minimum 6 characters (Supabase requirement)

   Note: Email format validation is intentionally basic. Invalid domains
   (e.g., "gmail.com1") are caught by Supabase server-side validation.

   Dependencies: None (pure utility)
   Used by: login-page.handlers.* (all auth handlers)
   ========================================================================== */

/**
 * Validate email format using basic regex
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email matches basic pattern
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password meets minimum requirements
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets requirements
 */
export function isValidPassword(password) {
  return password && password.length >= 6;
}

/**
 * Validate required fields are filled
 * @param {string} email - Email input value
 * @param {string} password - Password input value
 * @returns {boolean} True if both fields have values
 */
export function hasRequiredFields(email, password) {
  return Boolean(email && password);
}
