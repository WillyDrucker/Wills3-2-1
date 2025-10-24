-- ============================================================================
-- ADD WORKOUT COMMITMENT AND SECOND BODY PART COLUMNS
--
-- Adds support for:
-- 1. is_committed: Tracks whether workout is complete and ready for editing
-- 2. body_part_2_color_key: Stores second body part color for Superset workouts
--
-- Migration: 20251022_add_committed_and_body_part_2
-- ============================================================================

-- Add is_committed column for workout commitment tracking
-- Default FALSE means workouts are uncommitted until marked complete
ALTER TABLE workouts
ADD COLUMN IF NOT EXISTS is_committed BOOLEAN DEFAULT FALSE;

-- Add body_part_2_color_key column for Superset mode second body part
-- Nullable because only Superset workouts have a second body part
ALTER TABLE workouts
ADD COLUMN IF NOT EXISTS body_part_2_color_key TEXT;

-- Update existing workouts to be uncommitted by default
-- (Already handled by DEFAULT FALSE, but explicit for clarity)
UPDATE workouts
SET is_committed = FALSE
WHERE is_committed IS NULL;

-- Add index for filtering committed workouts on My Data page
CREATE INDEX IF NOT EXISTS idx_workouts_is_committed ON workouts(is_committed);

-- Add comment for documentation
COMMENT ON COLUMN workouts.is_committed IS 'Tracks whether workout is complete and ready for editing in Update History modal';
COMMENT ON COLUMN workouts.body_part_2_color_key IS 'Second body part color key for Superset workouts (e.g., cc3 for day2)';
