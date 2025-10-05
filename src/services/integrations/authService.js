/* ==========================================================================
   AUTH SERVICE - User Authentication (Placeholder)

   Placeholder authentication service for future login/logout functionality.
   Currently returns stub functions for development.

   Dependencies: appState
   Used by: Reserved for future authentication implementation
   ========================================================================== */

import { appState } from "state";

export function login() {
  console.log("login function called");
}

export function logout() {
  console.log("logout function called");
}

export function getCurrentUser() {
  console.log("getCurrentUser function called");
  return appState.user;
}
