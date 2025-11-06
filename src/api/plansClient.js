/* ==========================================================================
   PLANS CLIENT - API Client for Training Plans Database

   Fetches training plan data from remote JSON database. Handles network
   errors and returns null on failure to prevent app crashes.

   Dependencies: config (PLANS_DATABASE_URL)
   Used by: my-plan.index.js (page initialization)
   ========================================================================== */

import { PLANS_DATABASE_URL } from "config";

/**
 * Transform raw plan data from flat JSON structure to nested app format
 * Converts new JSON format to internal structure for backward compatibility
 * and creates data access layer for future Supabase migration
 * @param {Array} rawPlans - Raw plan data from JSON with flat structure
 * @returns {Array} Transformed plans with nested structure
 */
function transformPlanData(rawPlans) {
  if (!Array.isArray(rawPlans)) {
    console.error("Invalid plan data: expected array, got", typeof rawPlans);
    return [];
  }

  return rawPlans
    .filter((plan, index) => {
      // Skip incomplete plans (no total_duration)
      if (!plan.total_duration) {
        console.warn(`Skipping incomplete plan at index ${index}:`, plan.plan_name || "Unknown");
        return false;
      }
      return true;
    })
    .map((plan, index) => {
      // Extract weeklyReps from flat week*_reps properties
      const weeklyReps = {};
      Object.keys(plan).forEach((key) => {
        const match = key.match(/^week(\d+)_reps$/);
        if (match) {
          weeklyReps[`week${match[1]}`] = plan[key];
        }
      });

      // Extract phases from flat week*-* properties (excluding _ew suffix)
      const phases = {};
      Object.keys(plan).forEach((key) => {
        if (key.match(/^week\d+-\d+$/) && !key.endsWith("_ew")) {
          phases[key] = plan[key];
        }
      });

      // Extract equipmentWeeks from flat week*-*_ew properties
      const equipmentWeeks = {};
      Object.keys(plan).forEach((key) => {
        const match = key.match(/^(week\d+-\d+)_ew$/);
        if (match) {
          equipmentWeeks[match[1]] = plan[key];
        }
      });

      // Transform to nested structure
      return {
        id: plan.plan_name, // Use plan_name as unique identifier
        name: plan.plan_name,
        totalWeeks: plan.total_duration,
        isDefault: index === 0, // First plan is default
        abbreviation: plan.abbreviation,
        planExerciseOrder: plan.plan_exercise_order,
        weeklyReps,
        phases,
        equipmentWeeks,
        planInformation: plan.plan_information || "",
      };
    });
}

export async function fetchPlans() {
  try {
    const response = await fetch(PLANS_DATABASE_URL);
    if (!response.ok) {
      throw new Error(`Network error: ${response.statusText}`);
    }
    const rawData = await response.json();

    // Transform flat JSON structure to nested app format
    const transformedPlans = transformPlanData(rawData);

    console.log(`[PlansClient] Loaded ${transformedPlans.length} plans from database`);
    return transformedPlans;
  } catch (error) {
    console.error("Failed to load or process plans database:", error);
    return null;
  }
}
