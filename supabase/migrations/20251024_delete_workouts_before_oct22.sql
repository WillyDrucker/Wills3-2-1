-- Delete all workout data prior to October 22, 2025
-- This cleans up old data that doesn't work properly with new workout session selectors

DELETE FROM workouts
WHERE timestamp < '2025-10-22 00:00:00'::timestamptz;
