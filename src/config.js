/* ==========================================================================
   CONFIG - Application configuration constants

   Central configuration for workout programs, time options, and business rules.
   All program-specific data and exercise database URLs defined here.

   Configuration sections:
   1. Exercise database URL
   2. Program configurations (order/color mappings)
   3. Color code mappings (exercise status indicators)
   4. Workout plans (program names and durations)
   5. Time options (Standard/Express/Maintenance)
   6. Express set rules (set reductions by day/exercise)
   7. Maintenance set rules (set additions by day/exercise)
   8. Muscle group sort order (display ordering)

   Dependencies: None (pure configuration)
   Used by: All services and features requiring config data
   ========================================================================== */

export const EXERCISE_DATABASE_URL =
  "https://beta.wills321.com/data/exercises.json";

// Supabase configuration
export const SUPABASE_URL = "https://exowzsiimszqdgswnffu.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4b3d6c2lpbXN6cWRnc3duZmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTY0MTMsImV4cCI6MjA3NTM3MjQxM30.zxzgF78MBad4yoWLsxTj0ZftwEeW6tlwePenAF0wIrg";

export const programConfig = {
  "Will's 3-2-1:": {
    orderKey: "program_order",
    colorKey: "program_color_code",
  },
  "Beginner:": { orderKey: "program1_order", colorKey: "program1_color_code" },
};

export const colorCodeMap = {
  cc1: "text-plan",
  cc2: "text-deviation",
  cc3: "text-warning",
  cc4: "text-orange",
  red: "text-skip",
};

export const workoutPlans = [
  { name: "Will's 3-2-1:", duration: "15 Weeks" },
  { name: "Beginner:", duration: "12 Weeks" },
];

export const timeOptions = [
  { name: "Standard:", type: "Recommended", colorClass: "text-plan" },
  { name: "Express:", type: "Express", colorClass: "text-deviation" },
  { name: "Maintenance:", type: "Maintenance", colorClass: "text-warning" },
];

export const expressSetRules = {
  Tuesday: [
    { name: "Reverse Wrist Curl", set: 1 },
    { name: "Forearm Wrist Curl", set: 2 },
  ],
  Wednesday: [
    { name: "Reverse Delt Flyes", set: 1 },
    { name: "Pistol Grip Front Raise", set: 1 },
  ],
  Thursday: [
    { name: "Tricep Push-Down", set: 1 },
    { name: "Machine-Dips", set: 2 },
  ],
  Friday: [
    { name: "Calf Raises", set: 1 },
    { name: "Leg Curl", set: 1 },
  ],
  Saturday: [
    { name: "Calf Raises", set: 1 },
    { name: "Leg Curl", set: 1 },
  ],
};

export const maintenanceSetRules = {
  Tuesday: { add: [{ name: "Forearm Wrist Curl", set: 1 }] },
  Thursday: { add: [{ name: "Machine-Dips", set: 1 }] },
};

export const muscleGroupSortOrder = {
  Major1: 1,
  Minor1: 2,
  Major2: 3,
  Minor2: 4,
  Tertiary: 5,
};
