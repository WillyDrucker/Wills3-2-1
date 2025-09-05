export function getExerciseWithLink(exercise) {
  if (!exercise) return null;

  const exerciseData = { ...exercise };

  if (exerciseData.muscle_group === "Major1") {
    exerciseData.youtube_link = "https://www.youtube.com/shorts/qASbflixYF4";
  }

  return exerciseData;
}
