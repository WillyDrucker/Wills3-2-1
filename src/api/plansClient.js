/* ==========================================================================
   PLANS CLIENT - API Client for Training Plans Database

   Fetches training plan data from remote JSON database. Handles network
   errors and returns null on failure to prevent app crashes.

   Dependencies: config (PLANS_DATABASE_URL)
   Used by: my-plan.index.js (page initialization)
   ========================================================================== */

import { PLANS_DATABASE_URL } from "config";

export async function fetchPlans() {
  try {
    const response = await fetch(PLANS_DATABASE_URL);
    if (!response.ok) {
      throw new Error(`Network error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to load or process plans database:", error);
    return null;
  }
}
