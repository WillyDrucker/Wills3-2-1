-- ==========================================================================
-- CHECK RLS POLICIES - Verify DELETE permissions
--
-- Run this in Supabase SQL Editor to check if DELETE policies exist
-- for workouts and workout_logs tables
-- ==========================================================================

-- Check all policies for workouts table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd, -- Should show DELETE for delete policies
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'workouts'
ORDER BY cmd, policyname;

-- Check all policies for workout_logs table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd, -- Should show DELETE for delete policies
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'workout_logs'
ORDER BY cmd, policyname;

-- ==========================================================================
-- EXPECTED RESULTS:
-- You should see policies with cmd = 'DELETE' for both tables
-- The qual column should contain: (auth.uid() = user_id)
--
-- If you DON'T see DELETE policies, run the create_rls_policies.sql script
-- ==========================================================================
