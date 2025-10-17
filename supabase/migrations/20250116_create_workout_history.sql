-- ============================================================================
-- WORKOUT HISTORY TABLES
--
-- Stores user workout sessions and individual set logs for history tracking
-- and progress visualization. Mirrors localStorage structure for easy migration.
-- ============================================================================

-- Workouts table: Overall workout session data
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  plan_name TEXT NOT NULL,
  session_type_name TEXT NOT NULL,
  session_color_class TEXT,
  body_part TEXT NOT NULL,
  body_part_color_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workout logs table: Individual set logs for each workout
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_data JSONB NOT NULL,
  set_number INTEGER NOT NULL,
  weight NUMERIC(10, 2) NOT NULL,
  reps INTEGER NOT NULL,
  status TEXT NOT NULL,
  superset_side TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_timestamp ON workouts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_body_part ON workouts(body_part);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_id ON workout_logs(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON workout_logs(user_id);

-- Row-Level Security Policies
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own workouts
CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own workouts
CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own workouts
CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own workouts
CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);

-- Users can view their own workout logs
CREATE POLICY "Users can view own workout logs"
  ON workout_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own workout logs
CREATE POLICY "Users can insert own workout logs"
  ON workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own workout logs
CREATE POLICY "Users can update own workout logs"
  ON workout_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own workout logs
CREATE POLICY "Users can delete own workout logs"
  ON workout_logs FOR DELETE
  USING (auth.uid() = user_id);
