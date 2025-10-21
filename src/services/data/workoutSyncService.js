/* ==========================================================================
   WORKOUT SYNC SERVICE - Module Re-export

   This file re-exports workout sync operations from modular implementation.
   Maintains backward compatibility with existing imports.

   Modular Structure:
   - workoutSyncService.save.js: Save/UPSERT operations
   - workoutSyncService.load.js: Load/query operations
   - workoutSyncService.delete.js: Delete operations
   - workoutSyncService.migrate.js: Migration + initialization

   Architecture:
   - Immediate save pattern with sequential queue (prevents race conditions)
   - UPSERT pattern: UPDATE if exists, INSERT if new
   - ID conversion: Database strings → App numbers
   - Foreign key handling: Delete logs before workouts

   Dependencies: Modular workoutSyncService files
   Used by: historyService, appInitializerService, my-data
   ========================================================================== */

export {
  saveWorkoutToDatabase,
} from "./workoutSyncService.save.js";

export {
  loadWorkoutsFromDatabase,
  getLastBodyPartLifts,
} from "./workoutSyncService.load.js";

export {
  deleteWorkoutFromDatabase,
  clearTodaysWorkouts,
} from "./workoutSyncService.delete.js";

export {
  migrateLocalWorkoutsToDatabase,
  initializeWorkoutSync,
} from "./workoutSyncService.migrate.js";
