-- ============================================================================
-- PLAN PROGRESS TABLE
--
-- Tracks user plan lifecycle and progress for displaying plan history
-- in My Plan Results page. Stores which plans have been started, when
-- they were active, and their completion status.
-- ============================================================================

-- Plan progress table: Tracks active and historical plans per user
CREATE TABLE IF NOT EXISTS plan_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  plan_duration_weeks INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'switched')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plan_progress_user_id ON plan_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_progress_status ON plan_progress(status);
CREATE INDEX IF NOT EXISTS idx_plan_progress_start_date ON plan_progress(start_date DESC);

-- Row-Level Security Policies
ALTER TABLE plan_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own plan progress
CREATE POLICY "Users can view own plan progress"
  ON plan_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own plan progress
CREATE POLICY "Users can insert own plan progress"
  ON plan_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own plan progress
CREATE POLICY "Users can update own plan progress"
  ON plan_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own plan progress
CREATE POLICY "Users can delete own plan progress"
  ON plan_progress FOR DELETE
  USING (auth.uid() = user_id);
