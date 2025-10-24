-- Add completed_timestamp column to workouts table
-- Tracks when a workout was marked as complete/committed

ALTER TABLE workouts
ADD COLUMN completed_timestamp TIMESTAMPTZ;

-- Column is nullable to handle existing workouts without completion timestamps
-- New workouts will have this populated when markCurrentWorkoutCommitted() is called
