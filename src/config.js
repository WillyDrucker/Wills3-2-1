export const EXERCISE_DATABASE_URL =
  "https://beta.wills321.com/data/exercises.json";

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
