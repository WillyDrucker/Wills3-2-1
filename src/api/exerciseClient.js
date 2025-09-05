import { EXERCISE_DATABASE_URL } from "config";

export async function fetchExercises() {
  try {
    const response = await fetch(EXERCISE_DATABASE_URL);
    if (!response.ok) {
      throw new Error(`Network error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to load or process exercise database:", error);
    return null;
  }
}
