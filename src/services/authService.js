/* ==========================================================================
   AUTH SERVICE - User authentication management

   Handles user authentication operations using Supabase Auth:
   - Sign up (create new account)
   - Sign in (email + password login)
   - Sign out (logout)
   - Session management
   - Auth state changes

   🔒 CEMENT: Guest mode support
   - Users can bypass authentication with "Continue as Guest"
   - Guest mode uses localStorage only (no sync)
   - Smooth upgrade path from guest to authenticated user

   Dependencies: supabaseClient.js, appState
   Used by: login-page, side-nav, main.js
   ========================================================================== */

import { supabase } from "lib/supabaseClient.js";
import { appState } from "state";

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password (min 6 characters)
 * @returns {Promise<{user, session, error}>}
 */
export async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    // Update app state with user info ONLY if session exists
    // With "Confirm email" enabled, user is returned but session is null until email confirmed
    if (data.user && data.session) {
      updateAuthState(data.user, data.session);
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err) {
    return { user: null, session: null, error: err.message };
  }
}

/**
 * Sign in existing user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<{user, session, error}>}
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    // Update app state with user info
    if (data.user) {
      updateAuthState(data.user, data.session);
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err) {
    return { user: null, session: null, error: err.message };
  }
}

/**
 * Sign out current user
 * @returns {Promise<{error}>}
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    // Clear auth state
    clearAuthState();

    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Update user password
 * @param {string} newPassword - New password (min 6 characters)
 * @returns {Promise<{user, error}>}
 */
export async function updatePassword(newPassword) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: err.message };
  }
}

/**
 * Request password reset email
 * Sends secure reset link to user's email with dynamic redirect URL
 * @param {string} email - User's email address
 * @returns {Promise<{error}>}
 */
export async function resetPasswordForEmail(email) {
  try {
    // Dynamic redirect URL based on current environment
    // Works for: localhost, 127.0.0.1, wills321.com, beta.wills321.com
    const redirectUrl = `${window.location.origin}/reset-password.html`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Get current session (if user is logged in)
 * @returns {Promise<{session, error}>}
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { session: null, error: error.message };
    }

    // Update app state if session exists
    if (data.session) {
      updateAuthState(data.session.user, data.session);
    }

    return { session: data.session, error: null };
  } catch (err) {
    return { session: null, error: err.message };
  }
}

/**
 * Get current authenticated user
 * @returns {Promise<{user, error}>}
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: err.message };
  }
}

/**
 * Set up auth state change listener
 * Automatically updates appState when user logs in/out
 * @param {Function} callback - Optional callback function (user, session) => {}
 */
export function onAuthStateChange(callback) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // User logged in
      updateAuthState(session.user, session);
    } else {
      // User logged out
      clearAuthState();
    }

    // Call optional callback
    if (callback) {
      callback(session?.user || null, session);
    }
  });
}

/**
 * Continue as guest (bypass authentication)
 * Sets guest mode flag in app state
 */
export function continueAsGuest() {
  appState.auth = {
    isAuthenticated: false,
    isGuest: true,
    user: null,
    session: null,
  };
}

/**
 * Check if user is currently authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return appState.auth?.isAuthenticated === true;
}

/**
 * Check if user is in guest mode
 * @returns {boolean}
 */
export function isGuest() {
  return appState.auth?.isGuest === true;
}

// === INTERNAL HELPERS ===

/**
 * Update appState with authenticated user info
 * IMPORTANT: Only sets isAuthenticated=true if BOTH user AND session exist
 * @private
 */
function updateAuthState(user, session) {
  // Require BOTH user and session for authentication
  const hasValidSession = user && session;

  appState.auth = {
    isAuthenticated: hasValidSession,
    isGuest: false,
    user: user ? {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
    } : null,
    session: session,
  };
}

/**
 * Clear auth state (user logged out)
 * @private
 */
function clearAuthState() {
  appState.auth = {
    isAuthenticated: false,
    isGuest: false,
    user: null,
    session: null,
  };
}
