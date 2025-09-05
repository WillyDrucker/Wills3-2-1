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
