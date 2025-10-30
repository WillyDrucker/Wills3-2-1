/* ==========================================================================
   AUTH SERVICE - User Authentication (Placeholder)

   Placeholder authentication service for future login/logout functionality.
   Currently returns stub functions for development.

   Dependencies: appState
   Used by: Reserved for future authentication implementation
   ========================================================================== */

import { appState } from "state";

export function login() {
  // Placeholder for future authentication
}

export function logout() {
  // Placeholder for future authentication
}

export function getCurrentUser() {
  return appState.user;
}
