-- ==========================================================================
-- CREATE DELETE RLS POLICIES
--
-- Run this ONLY if check_rls_policies.sql shows missing DELETE policies
-- Allows authenticated users to delete their own workout data
-- ==========================================================================

-- Enable RLS on tables (if not already enabled)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- DROP existing DELETE policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Users can delete own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can delete own workout logs" ON workout_logs;

-- CREATE DELETE policy for workouts table
CREATE POLICY "Users can delete own workouts"
  ON workouts
  FOR DELETE
  USING (auth.uid() = user_id);

-- CREATE DELETE policy for workout_logs table
CREATE POLICY "Users can delete own workout logs"
  ON workout_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================================================
-- VERIFICATION:
-- After running this, run check_rls_policies.sql again to verify
-- You should see DELETE policies with qual: (auth.uid() = user_id)
-- ==========================================================================
