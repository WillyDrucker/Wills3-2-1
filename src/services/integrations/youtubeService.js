/* ==========================================================================
   YOUTUBE SERVICE - Video Link Injection

   Adds YouTube video links to exercises based on muscle group. Currently adds
   demo link for Major1 muscle group exercises.

   Dependencies: None
   Used by: workout/workoutLogGenerationService, workout/workoutProgressionService
   ========================================================================== */

export function getExerciseWithLink(exercise) {
  if (!exercise) return null;

  const exerciseData = { ...exercise };

  if (exerciseData.muscle_group === "Major1") {
    exerciseData.youtube_link = "https://www.youtube.com/shorts/qASbflixYF4";
  }

  return exerciseData;
}
